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

resource "aws_s3_bucket_policy" "allow_access_from_cloudfront" {
  bucket = aws_s3_bucket.media_assets.id
  policy = data.aws_iam_policy_document.allow_access_from_cloudfront.json
}

data "aws_iam_policy_document" "allow_access_from_cloudfront" {
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
