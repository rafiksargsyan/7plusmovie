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

module "cf_distro_chalkhalting_3" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting-3
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_chalkhalting_4" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting-4
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_chalkhalting_5" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting-5
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_chalkhalting_6" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting-6
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_chalkhalting_7" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting-7
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_chalkhalting_8" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting-8
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_chalkhalting_9" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.chalkhalting-9
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}
