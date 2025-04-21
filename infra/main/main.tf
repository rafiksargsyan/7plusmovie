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
    id = "expire-after-one-week"

    expiration {
      days = 7
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
      test     = "StringLike"
      values   = ["*"]
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
      "s3:GetObjectTagging"
    ]

    resources = [
      "arn:aws:s3:::${aws_s3_bucket.media_assets.bucket}/*",
      "arn:aws:s3:::${aws_s3_bucket.media_assets.bucket}",
    ]
  }
}

resource "aws_dynamodb_table" "movie" {
  name     = "${local.deployment_id}-movie"
  hash_key = "id"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "tmdbId"
    type = "S"
  }
  attribute {
    name = "_imdbId"
    type = "S"
  }

  global_secondary_index {
    name               = "tmdb-id"
    hash_key           = "tmdbId"
    projection_type    = "KEYS_ONLY"
  }

  global_secondary_index {
    name               = "imdb-id"
    hash_key           = "_imdbId"
    projection_type    = "KEYS_ONLY"
  }

  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  billing_mode     = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
  point_in_time_recovery {
    enabled = true
  }
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
  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_secretsmanager_secret" "secrets" {
  name = "${local.deployment_id}-secrets"
}

resource "aws_secretsmanager_secret_version" "secrets_version" {
  secret_id     = aws_secretsmanager_secret.secrets.id
  secret_string = jsonencode(
    tomap({
      ALGOLIA_ADMIN_KEY: var.algolia_admin_key
      TYPESENSE_ADMIN_KEY: var.typesense_admin_key
      COOKIE_SIGNING_PRIVATE_KEY_BASE64_ENCODED: var.cookie_signing_private_key_base64_encoded
      TMDB_API_KEY: var.tmdb_api_key
      TVDB_API_KEY: var.tvdb_api_key
      R2_ACCESS_KEY_ID: var.r2_access_key_id
      R2_SECRET_ACCESS_KEY: var.r2_secret_access_key
      IPINFO_IO_TOKEN: var.ipinfo_io_token
      IPGEOLOCATION_IO_TOKEN: var.ipgeolocation_io_token
      R2_CACHABLE_ACCESS_KEY_ID: var.r2_cachable_access_key_id
      R2_CACHABLE_SECRET_ACCESS_KEY: var.r2_cachable_secret_access_key
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

resource "aws_cognito_user_pool_domain" "admin_user_pool_domain" {
  domain       = "${local.deployment_id}-admin"
  user_pool_id = aws_cognito_user_pool.admin_user_pool.id
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
    id = "default"

    expiration {
      days = 30
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

resource "aws_secretsmanager_secret" "ric_context_secrets" {
  name = "${local.deployment_id}-ric-ctx-secrets"
}

resource "aws_secretsmanager_secret_version" "ric_context_secrets_version" {
  secret_id     = aws_secretsmanager_secret.ric_context_secrets.id
  secret_string = jsonencode(
    tomap({
      TMDB_API_KEY: var.tmdb_api_key
      TVDB_API_KEY: var.tvdb_api_key
      RADARR_API_KEY: var.radarr_api_key
      QBITTORRENT_PASSWORD: var.qbittorrent_password
      SONARR_API_KEY: var.sonarr_api_key
    })
  )
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

data "cloudflare_zone" "media_assets" {
  name = var.cloudflare_zone_media_assets
}

resource "cloudflare_page_rule" "bypass_cache_media_assets" {
  zone_id = data.cloudflare_zone.media_assets.id
  target = "${var.cloudflare_media_assets_prefix}.${var.cloudflare_zone_media_assets}/*"

  actions {
    cache_level = "bypass"
  }
}

resource "aws_dynamodb_table" "tv_show_v2" {
  name      = "${local.deployment_id}-tv_show_v2"
  hash_key  = "PK"
  range_key = "SK"
  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  billing_mode     = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dynamodb_table" "movie_release_indexer_context" {
  name     = "${local.deployment_id}-movie-ric"
  hash_key = "_id"
  attribute {
    name = "_id"
    type = "S"
  }
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  billing_mode     = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_s3_bucket" "trt_files" {
  bucket = "trt-files-${local.deployment_id}"
}

resource "aws_s3_bucket_policy" "trt_files_public_access" {
  bucket = aws_s3_bucket.trt_files.bucket

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "s3:GetObject"
        Resource = "arn:aws:s3:::${aws_s3_bucket.trt_files.bucket}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "raw_media_assets_public_access" {
  bucket = aws_s3_bucket.raw_media_assets.bucket

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "s3:GetObject"
        Resource = "arn:aws:s3:::${aws_s3_bucket.raw_media_assets.bucket}/*"
      }
    ]
  })
}

resource "aws_dynamodb_table" "tvshow_release_indexer_context" {
  name     = "${local.deployment_id}-tvshow-ric"
  hash_key  = "PK"
  range_key = "SK"
  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  billing_mode     = "PAY_PER_REQUEST"
  deletion_protection_enabled = var.dynamodb_deletion_protection_enabled
  point_in_time_recovery {
    enabled = true
  }
}
