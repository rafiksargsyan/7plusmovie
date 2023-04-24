module "cf_distro_chalkhalting" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_chalkhalting_1" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting-1
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_chalkhalting_2" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting-2
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_mutantcandlelight" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.mutantcandlelight
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_mutantcandlelight_1" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.mutantcandlelight_1
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_mutantcandlelight_2" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.mutantcandlelight_2
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}