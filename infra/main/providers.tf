provider "aws" {
  region     = var.aws_workloads_region
  access_key = var.aws_workloads_access_key
  secret_key = var.aws_workloads_secret_key
}

provider "cloudflare" {
  email   = var.cloudflare_email
  api_key = var.cloudflare_api_key
}
