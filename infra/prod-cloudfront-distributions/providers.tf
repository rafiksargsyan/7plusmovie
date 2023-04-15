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
  alias  = "chalkhalting-3"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::890562047398:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting3"
  }
}

provider "aws" {
  alias  = "chalkhalting-4"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::961502097964:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting4"
  }
}

provider "aws" {
  alias  = "chalkhalting-5"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::496682576476:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting5"
  }
}

provider "aws" {
  alias  = "chalkhalting-6"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::678740976265:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting6"
  }
}

provider "aws" {
  alias  = "chalkhalting-7"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::452217002998:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting7"
  }
}

provider "aws" {
  alias  = "chalkhalting-8"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::520864709150:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting8"
  }
}

provider "aws" {
  alias  = "chalkhalting-9"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::388940278029:role/WorkloadsProd1AssumeRole"
    session_name = "chalkhalting9"
  }
}
