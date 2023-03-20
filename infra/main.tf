resource "aws_s3_bucket" "media_assets" {
    bucket = "media-assets"
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "media_assets_it_config" {
    bucket = aws_s3_bucket.media_assets.id
    name   = "media-assets-it-config"
}
