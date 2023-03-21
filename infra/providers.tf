provider "aws" {
    region     = var.aws_workloads_region
    access_key = var.aws_workloads_access_key
    secret_key = var.aws_workloads_secret_key
}

provider "aws" {
    alias  = "chalkhalting"
    region = var.aws_workloads_region
    assume_role {
      role_arn     = "arn:aws:iam::863389750426:role/WorkloadsProd1AssumeRole"
      session_name = "chalkhalting"
  }
}