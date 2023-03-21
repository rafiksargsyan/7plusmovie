resource "aws_cloudfront_distribution" "distro" {
    origin {
        domain_name = var.s3_bucket_domain_name
        origin_id   = "s3-bucket"
    }
}