module "chalkhalting" {
    source = "./modules/cloudfront_distribution"
    s3_bucket_domain_name = aws_s3_bucket.media_assets.bucket_regional_domain_name
}