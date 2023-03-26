variable "aws_workloads_region" {
  type    = string
  default = "eu-west-3"
}

variable "aws_workloads_access_key" {
  type = string
}

variable "aws_workloads_secret_key" {
  type = string
}

variable "deployment_name" {
  type = string
}

variable "cloudfront_distro_arns" {
  type = list(string)
}

variable "dynamodb_deletion_protection_enabled" {
  type    = bool
  default = false
}

variable "cloudinary_api_secret" {
  type = string
}

variable "algolia_admin_key" {
  type = string
}

variable "cookie_signing_private_key_base64_encoded" {
  type = string
}
