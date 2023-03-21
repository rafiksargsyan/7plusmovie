data "aws_s3_bucket" "media_assets_bucket" {
  bucket = "media-assets-prod-e1pjapsk"
}

resource "aws_cloudfront_distribution" "chalkhalting" {
  provider = aws.chalkhalting
  enabled = true
  default_cache_behavior {
    allowed_methods        = []
    cached_methods         = []
    target_origin_id       = data.aws_s3_bucket.media_assets_bucket.bucket
    viewer_protocol_policy = "allow-all"
    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }
  origin {
    domain_name = data.aws_s3_bucket.media_assets_bucket.bucket_regional_domain_name
    origin_id   = data.aws_s3_bucket.media_assets_bucket.bucket
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {}
}
