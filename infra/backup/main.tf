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
