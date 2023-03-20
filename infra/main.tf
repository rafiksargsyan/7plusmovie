resource "aws_s3_bucket" "media_assets" {
    bucket = "media-assets"
}

resource "aws_s3_bucket_lifecycle_configuration" "media_assets_lifecycle_config" {
    bucket = aws_s3_bucket.media_assets.bucket
    
    transition {
        storage_class = "INTELLIGENT_TIERING"
    }
}