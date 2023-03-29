output "cf_domain" {
  value = aws_cloudfront_distribution.cf_distro.domain_name
}

output "signer_key_id" {
  value = aws_cloudfront_public_key.signing_verification_public_key.id
}

output "cf_arn" {
  value = aws_cloudfront_distribution.cf_distro.arn
}

output "cf_aws_account_number" {
  value = data.aws_caller_identity.cf_caller_identity.account_id
}
