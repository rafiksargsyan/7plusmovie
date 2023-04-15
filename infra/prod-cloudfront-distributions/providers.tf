provider "aws" {
  region     = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key
}

provider "aws" {
  alias  = "chalkhalting"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::863389750426:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting"
  }
}

provider "aws" {
  alias  = "chalkhalting-1"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::139486306394:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting1"
  }
}
