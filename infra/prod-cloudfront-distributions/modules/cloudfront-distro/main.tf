data "aws_s3_bucket" "media_assets_bucket" {
  bucket = var.source_bucket_name
}

resource "aws_cloudfront_distribution" "cf_distro" {
  provider = "aws.cf_account"
  enabled = true
  default_cache_behavior {
    allowed_methods        = ["HEAD", "GET"]
    cached_methods         = ["HEAD", "GET"]
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
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
