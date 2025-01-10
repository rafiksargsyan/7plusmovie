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

variable "tmdb_api_key" {
  type = string
}

variable "github_webhook_secret" {
  type = string
}

variable "github_pat" {
  type = string
}

variable "workflow_run_id_provider_hook_secret" {
  type = string
}

variable "cloudflare_email" {
  type = string
}

variable "cloudflare_api_key" {
  type = string
}

variable "cloudflare_account_id" {
  type = string
}

variable "cloudflare_zone_media_assets" {
  type = string
}

variable "cloudflare_media_assets_prefix" {
  type = string
}

variable r2_access_key_id {
  type = string
}

variable "r2_secret_access_key" {
  type = string
}

variable r2_cachable_access_key_id {
  type = string
}

variable "r2_cachable_secret_access_key" {
  type = string
}

variable "radarr_api_key" {
  type = string
}

variable "qbittorrent_password" {
  type = string
}

variable "sonarr_api_key" {
  type = string
}

variable "ipinfo_io_token" {
  type = string
}

variable "ipgeolocation_io_token" {
  type = string
}