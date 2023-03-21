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
      "${aws_s3_bucket.media_assets.arn}/*"
    ]

    condition {
      test = "StringEquals"

      values = var.cloudfront_distro_arns

      variable = "aws:SourceArn"
    }
  }
}
