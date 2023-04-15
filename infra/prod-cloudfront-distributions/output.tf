output "chalkhalting" {
  value = tomap({
    "cf_domain": module.cf_distro_chalkhalting.cf_domain,
    "signer_key_id": module.cf_distro_chalkhalting.signer_key_id,
    "cf_arn": module.cf_distro_chalkhalting.cf_arn,
    "assume_role_arn_for_main_account" : "arn:aws:iam::863389750426:role/WorkloadsProd1AssumeRole",
    "aws_account_number" : module.cf_distro_chalkhalting.cf_aws_account_number
  })
}

output "chalkhalting_1" {
  value = tomap({
    "cf_domain": module.cf_distro_chalkhalting_1.cf_domain,
    "signer_key_id": module.cf_distro_chalkhalting_1.signer_key_id,
    "cf_arn": module.cf_distro_chalkhalting_1.cf_arn,
    "assume_role_arn_for_main_account" : "arn:aws:iam::139486306394:role/WorkloadsProd1AssumeRole",
    "aws_account_number" : module.cf_distro_chalkhalting_1.cf_aws_account_number
  })
}