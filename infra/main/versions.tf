terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.59.0"
    }
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "4.21.0"
    }
  }
}
