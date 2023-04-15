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

output "chalkhalting_2" {
  value = tomap({
    "cf_domain": module.cf_distro_chalkhalting_2.cf_domain,
    "signer_key_id": module.cf_distro_chalkhalting_2.signer_key_id,
    "cf_arn": module.cf_distro_chalkhalting_2.cf_arn,
    "assume_role_arn_for_main_account" : "arn:aws:iam::894612417045:role/WorkloadsProd1AssumeRole",
    "aws_account_number" : module.cf_distro_chalkhalting_2.cf_aws_account_number
  })
}

#output "chalkhalting_3" {
#  value = tomap({
#    "cf_domain": module.cf_distro_chalkhalting_3.cf_domain,
#    "signer_key_id": module.cf_distro_chalkhalting_3.signer_key_id,
#    "cf_arn": module.cf_distro_chalkhalting_3.cf_arn,
#    "assume_role_arn_for_main_account" : "arn:aws:iam::890562047398:role/WorkloadsProd1AssumeRole",
#    "aws_account_number" : module.cf_distro_chalkhalting_3.cf_aws_account_number
#  })
#}
#
#output "chalkhalting_4" {
#  value = tomap({
#    "cf_domain": module.cf_distro_chalkhalting_4.cf_domain,
#    "signer_key_id": module.cf_distro_chalkhalting_4.signer_key_id,
#    "cf_arn": module.cf_distro_chalkhalting_4.cf_arn,
#    "assume_role_arn_for_main_account" : "arn:aws:iam::961502097964:role/WorkloadsProd1AssumeRole",
#    "aws_account_number" : module.cf_distro_chalkhalting_4.cf_aws_account_number
#  })
#}
#
#output "chalkhalting_5" {
#  value = tomap({
#    "cf_domain": module.cf_distro_chalkhalting_5.cf_domain,
#    "signer_key_id": module.cf_distro_chalkhalting_5.signer_key_id,
#    "cf_arn": module.cf_distro_chalkhalting_5.cf_arn,
#    "assume_role_arn_for_main_account" : "arn:aws:iam::496682576476:role/WorkloadsProd1AssumeRole",
#    "aws_account_number" : module.cf_distro_chalkhalting_5.cf_aws_account_number
#  })
#}
#
#output "chalkhalting_6" {
#  value = tomap({
#    "cf_domain": module.cf_distro_chalkhalting_6.cf_domain,
#    "signer_key_id": module.cf_distro_chalkhalting_6.signer_key_id,
#    "cf_arn": module.cf_distro_chalkhalting_6.cf_arn,
#    "assume_role_arn_for_main_account" : "arn:aws:iam::678740976265:role/WorkloadsProd1AssumeRole",
#    "aws_account_number" : module.cf_distro_chalkhalting_6.cf_aws_account_number
#  })
#}
#
#output "chalkhalting_7" {
#  value = tomap({
#    "cf_domain": module.cf_distro_chalkhalting_7.cf_domain,
#    "signer_key_id": module.cf_distro_chalkhalting_7.signer_key_id,
#    "cf_arn": module.cf_distro_chalkhalting_7.cf_arn,
#    "assume_role_arn_for_main_account" : "arn:aws:iam::452217002998:role/WorkloadsProd1AssumeRole",
#    "aws_account_number" : module.cf_distro_chalkhalting_7.cf_aws_account_number
#  })
#}
#
#output "chalkhalting_8" {
#  value = tomap({
#    "cf_domain": module.cf_distro_chalkhalting_8.cf_domain,
#    "signer_key_id": module.cf_distro_chalkhalting_8.signer_key_id,
#    "cf_arn": module.cf_distro_chalkhalting_8.cf_arn,
#    "assume_role_arn_for_main_account" : "arn:aws:iam::520864709150:role/WorkloadsProd1AssumeRole",
#    "aws_account_number" : module.cf_distro_chalkhalting_8.cf_aws_account_number
#  })
#}
#
#output "chalkhalting_9" {
#  value = tomap({
#    "cf_domain": module.cf_distro_chalkhalting_9.cf_domain,
#    "signer_key_id": module.cf_distro_chalkhalting_9.signer_key_id,
#    "cf_arn": module.cf_distro_chalkhalting_9.cf_arn,
#    "assume_role_arn_for_main_account" : "arn:aws:iam::388940278029:role/WorkloadsProd1AssumeRole",
#    "aws_account_number" : module.cf_distro_chalkhalting_9.cf_aws_account_number
#  })
#}
