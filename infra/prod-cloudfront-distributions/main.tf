module "cf_distro_chalkhalting" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws = "aws.chalkhalting"
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
}
