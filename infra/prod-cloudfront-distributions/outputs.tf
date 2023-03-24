output "chalkhalting" {
  value = tomap({
    "cf_domain": module.cf_distro_chalkhalting.cf_domain,
    "signer_key_id": module.cf_distro_chalkhalting.signer_key_id
  })
}
