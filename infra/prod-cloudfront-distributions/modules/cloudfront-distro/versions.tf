terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.59.0"
      configuration_aliases = [ aws.cf_account ]
    }
  }
}
