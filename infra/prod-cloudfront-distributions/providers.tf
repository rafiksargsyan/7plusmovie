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

provider "aws" {
  alias  = "tracenoon_3"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::523394433783:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_3"
  }
}

provider "aws" {
  alias  = "tracenoon_4"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::854974172325:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_4"
  }
}

provider "aws" {
  alias  = "tracenoon_5"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::008105583531:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_5"
  }
}

provider "aws" {
  alias  = "tracenoon_6"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::634696200032:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_6"
  }
}

provider "aws" {
  alias  = "tracenoon_7"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::433060744289:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_7"
  }
}

provider "aws" {
  alias  = "tracenoon_8"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::541535291396:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_8"
  }
}

provider "aws" {
  alias  = "tracenoon_9"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::999477772323:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_9"
  }
}

provider "aws" {
  alias  = "tracenoon_10"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::334117940050:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_10"
  }
}

provider "aws" {
  alias  = "tracenoon_11"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::381467104808:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_11"
  }
}

provider "aws" {
  alias  = "tracenoon_12"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::734013559984:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_12"
  }
}

provider "aws" {
  alias  = "tracenoon_13"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::130456842086:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_13"
  }
}

provider "aws" {
  alias  = "tracenoon_14"

  region = "eu-west-3"
  access_key = var.aws_workloads_prod_access_key
  secret_key = var.aws_workloads_prod_secret_key

  assume_role {
    role_arn     = "arn:aws:iam::706464439161:role/WorkloadsProd1AssumeRole"
    session_name = "tracenoon_14"
  }
}
