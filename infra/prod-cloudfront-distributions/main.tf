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

module "cf_distro_tracenoon" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_1" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_1
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_2" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_2
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_3" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_3
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_4" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_4
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_5" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_5
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_6" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_6
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_7" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_7
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_8" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_8
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_9" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_9
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_10" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_10
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}

module "cf_distro_tracenoon_11" {
  source = "./modules/cloudfront-distro"
  providers = {
    aws.cf_account = aws.tracenoon_11
  }

  source_bucket_name = "media-assets-prod-e1pjapsk"
  signing_validation_public_key_path = "./resources/public-key.pem"
}
