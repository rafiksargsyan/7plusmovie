module "cf_distro_chalkhalting" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_publick_key_path = "./resources/public-key.pem"
}
