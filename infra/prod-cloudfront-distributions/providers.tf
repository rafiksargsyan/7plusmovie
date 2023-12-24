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

provider "aws" {
  alias  = "chalkhalting-2"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::894612417045:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting2"
  }
}

provider "aws" {
  alias  = "mutantcandlelight"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::309921977173:role/WorkloadsProd1AssumeRole"
    session_name = "mutantcandlelight"
  }
}

provider "aws" {
  alias  = "mutantcandlelight_1"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::011949300477:role/WorkloadsProd1AssumeRole"
    session_name = "mutantcandlelight1"
  }
}

provider "aws" {
  alias  = "mutantcandlelight_2"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::386464960221:role/WorkloadsProd1AssumeRole"
    session_name = "mutantcandlelight2"
  }
}

provider "aws" {
  alias  = "tracenoon"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::694508858683:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon"
  }
}

provider "aws" {
  alias  = "tracenoon_1"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::831916282287:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_1"
  }
}

provider "aws" {
  alias  = "tracenoon_2"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::855101825283:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_2"
  }
}
