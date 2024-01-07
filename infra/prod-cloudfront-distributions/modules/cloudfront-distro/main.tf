data "aws_s3_bucket" "media_assets_bucket" {
  bucket = var.source_bucket_name
}

resource "aws_cloudfront_distribution" "cf_distro" {
  provider = aws.cf_account
  enabled = true
  default_cache_behavior {
    allowed_methods        = ["HEAD", "GET", "OPTIONS"]
    cached_methods         = ["HEAD", "GET"]
    target_origin_id       = data.aws_s3_bucket.media_assets_bucket.bucket
    viewer_protocol_policy = "allow-all"
    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
    trusted_key_groups = []
    response_headers_policy_id = aws_cloudfront_response_headers_policy.cors_policy.id
  }
  origin {
    domain_name              = data.aws_s3_bucket.media_assets_bucket.bucket_regional_domain_name
    origin_id                = data.aws_s3_bucket.media_assets_bucket.bucket
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
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

resource "aws_cloudfront_origin_access_control" "oac" {
  provider                          = aws.cf_account
  name                              = "s3-origin-access-control"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_public_key" "signing_verification_public_key" {
  provider    = aws.cf_account
  encoded_key = file(var.signing_validation_public_key_path)
  name        = "signing-verification-public-key"
}

resource "aws_cloudfront_key_group" "signers_key_group" {
  provider = aws.cf_account
  name     = "signers-key-group"
  items    = [ aws_cloudfront_public_key.signing_verification_public_key.id ]
}

data "aws_caller_identity" "cf_caller_identity" {
  provider = aws.cf_account
}

resource "aws_cloudfront_response_headers_policy" "cors_policy" {
  provider = aws.cf_account
  name     = "cors-policy"
  cors_config {

    access_control_allow_methods {
      items = ["GET", "OPTIONS"]
    }

    access_control_allow_origins {
      items = ["https://www.q62.xyz", "http://localhost:3000", "http://web-ui.q62.xyz", "https://web-ui.q62.xyz",
               "https://reference.dashif.org", "https://hlsjs.video-dev.org", "https://bitmovin.com"]
    }

    origin_override = true

    access_control_allow_credentials = false
    access_control_allow_headers {
      items = ["*"]
    }
  }
}
