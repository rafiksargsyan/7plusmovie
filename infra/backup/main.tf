resource "aws_s3_bucket" "media_assets_backup" {
  bucket = "media-assets-backup"
}

resource "aws_s3_bucket_lifecycle_configuration" "media_assets_backup_lifecycle_config" {
  bucket = aws_s3_bucket.media_assets_backup.bucket

  rule {
    id = "deep-archive"

    transition {
      storage_class = "DEEP_ARCHIVE"
    }

    status = "Enabled"
  }
}

resource "aws_s3_bucket" "dynamodb_backup" {
  bucket = "q62-dynamodb-backup"
}

resource "aws_s3_bucket_lifecycle_configuration" "dynamodb_backup_lifecycle_config" {
  bucket = aws_s3_bucket.dynamodb_backup.bucket

  rule {
    id = "deep-archive"

    transition {
      storage_class = "DEEP_ARCHIVE"
    }

    status = "Enabled"
  }
}

resource "aws_s3_bucket_policy" "dynamodb_backup_s3_bucket_policy" {
  bucket = aws_s3_bucket.dynamodb_backup.id
  policy = data.aws_iam_policy_document.dynamodb_backup_s3_bucket_policy_document.json
}

data "aws_iam_policy_document" "dynamodb_backup_s3_bucket_policy_document" {
  statement {
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::003200941285:root"]
    }

    actions = [
      "s3:AbortMultipartUpload",
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]

    resources = [
      "arn:aws:s3:::${aws_s3_bucket.dynamodb_backup.bucket}/*",
      "arn:aws:s3:::${aws_s3_bucket.dynamodb_backup.bucket}",
    ]
  }
}
