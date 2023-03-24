output "cf_domain" {
  value = aws_cloudfront_distribution.cf_distro.domain_name
}

output "signer_key_id" {
  value = aws_cloudfront_public_key.signing_verification_public_key.id
}