resource "random_string" "deployment_random_part" {
  length  = 8
  special = false
  upper   = false
}

locals {
  deployment_id = "${var.deployment_name}-${random_string.deployment_random_part.id}"
}

resource "aws_s3_bucket" "media_assets" {
  bucket = "media-assets-${local.deployment_id}"
}

resource "aws_s3_bucket_lifecycle_configuration" "media_assets_lifecycle_config" {
  bucket = aws_s3_bucket.media_assets.bucket

  rule {
    id = "intelligent-tiering"

    transition {
        storage_class = "INTELLIGENT_TIERING"
    }

    status = "Enabled"
  }
}

resource "aws_s3_bucket_policy" "media_assets_s3_bucket_policy" {
  bucket = aws_s3_bucket.media_assets.id
  policy = data.aws_iam_policy_document.media_assets_s3_bucket_policy_document.json
}

data "aws_iam_policy_document" "media_assets_s3_bucket_policy_document" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.media_assets.arn}/*",
      "${aws_s3_bucket.media_assets.arn}"
    ]

    condition {
      test     = "StringEquals"
      values   = var.cloudfront_distro_arns
      variable = "aws:SourceArn"
    }
  }

  statement {
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::831217381634:root"]
    }

    actions = [
      "s3:ListBucket",
      "s3:GetObject",
    ]

    resources = [
      "arn:aws:s3:::${aws_s3_bucket.media_assets.bucket}/*",
      "arn:aws:s3:::${aws_s3_bucket.media_assets.bucket}",
    ]
  }
}

resource "aws_s3_object" "test_object" {
  bucket = aws_s3_bucket.media_assets.bucket
  key    = "test-file.txt"
  source = "./resources/test-file.txt"
  etag   = filemd5("./resources/test-file.txt")
}

resource "aws_dynamodb_table" "movie" {
  name     = "${local.deployment_id}-movie"
  hash_key = "id"
  attribute {
    name = "id"
    type = "S"
  }
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  billing_mode     = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
}

resource "aws_dynamodb_table" "cloudfront_distro_metadata" {
  name     = "${local.deployment_id}-cloudfront_distro_metadata"
  hash_key = "id"
  attribute {
    name = "id"
    type = "S"
  }
  billing_mode = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
}

resource "aws_secretsmanager_secret" "secrets" {
  name = "${local.deployment_id}-secrets"
}

resource "aws_secretsmanager_secret_version" "secrets_version" {
  secret_id     = aws_secretsmanager_secret.secrets.id
  secret_string = jsonencode(
    tomap({
      CLOUDINARY_API_SECRET: var.cloudinary_api_secret
      ALGOLIA_ADMIN_KEY: var.algolia_admin_key
      COOKIE_SIGNING_PRIVATE_KEY_BASE64_ENCODED: var.cookie_signing_private_key_base64_encoded
      TMDB_API_KEY: var.tmdb_api_key
    })
  )
}

resource "aws_s3_bucket_cors_configuration" "media_assets_cors" {
  bucket = aws_s3_bucket.media_assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
  }
}

resource "aws_cognito_user_pool" "admin_user_pool" {
  name = "${local.deployment_id}-admin-user-pool"

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  mfa_configuration = "OPTIONAL"

  username_configuration {
    case_sensitive = false
  }

  software_token_mfa_configuration {
    enabled = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

resource "aws_cognito_user_pool_client" "admin_client_cli" {
  name         = "${local.deployment_id}-admin-client-cli"
  user_pool_id = aws_cognito_user_pool.admin_user_pool.id

  explicit_auth_flows = ["USER_PASSWORD_AUTH"]
}

resource "aws_cognito_user" "rafiksargsyan07" {
  user_pool_id             = aws_cognito_user_pool.admin_user_pool.id
  username                 = "rafiksargsyan07@gmail.com"
  desired_delivery_mediums = ["EMAIL"]
  attributes = {
    email = "rafiksargsyan07@gmail.com"
  }
}

resource "aws_s3_bucket" "raw_media_assets" {
  bucket = "raw-media-assets-${local.deployment_id}"
}

resource "aws_s3_bucket_lifecycle_configuration" "raw_media_assets_lifecycle_config" {
  bucket = aws_s3_bucket.raw_media_assets.bucket

  rule {
    id = "remove-old-files"
    expiration {
      days = 5
    }
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "movie_transcoding_job" {
  name     = "${local.deployment_id}-movie_transcoding_job"
  hash_key = "id"
  attribute {
    name = "id"
    type = "S"
  }
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  billing_mode     = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

resource "aws_dynamodb_table" "transcoding_job" {
  name     = "${local.deployment_id}-transcoding_job"
  hash_key = "id"
  attribute {
    name = "id"
    type = "S"
  }
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  billing_mode     = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

resource "aws_secretsmanager_secret" "transcoding_context_secrets" {
  name = "${local.deployment_id}-trans-ctx-secrets"
}

resource "aws_secretsmanager_secret_version" "transcoding_context_secrets_version" {
  secret_id     = aws_secretsmanager_secret.transcoding_context_secrets.id
  secret_string = jsonencode(
    tomap({
      GITHUB_WEBHOOK_SECRET: var.github_webhook_secret
      GITHUB_PAT: var.github_pat
      WORKFLOW_RUN_ID_PROVIDER_HOOK_SECRET: var.workflow_run_id_provider_hook_secret
    })
  )
}

resource "aws_dynamodb_table" "tv_show" {
  name     = "${local.deployment_id}-tv_show"
  hash_key = "id"
  attribute {
    name = "id"
    type = "S"
  }
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  billing_mode     = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
}

resource "aws_dynamodb_table" "tv_show_transcoding_job" {
  name     = "${local.deployment_id}-tv_show_transcoding_job"
  hash_key = "id"
  attribute {
    name = "id"
    type = "S"
  }
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  billing_mode     = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

