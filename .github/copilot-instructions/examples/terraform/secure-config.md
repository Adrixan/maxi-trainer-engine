# Terraform Security Best Practices - Examples

## Remote State Configuration

### ❌ Bad Example (Local State)

```hcl
# No backend configuration - uses local state!
terraform {
  required_version = ">= 1.5.0"
}

resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}
```

**Problems:**

- State stored locally (risk of loss, no collaboration)
- No state locking (concurrent modifications can corrupt state)
- No encryption at rest
- No audit trail

---

### ✅ Good Example (Remote State with Locking)

**backend.tf**

```hcl
terraform {
  required_version = ">= 1.5.0, < 2.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "myorg-terraform-state"
    key            = "prod/vpc/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
    
    # Recommended: Enable versioning on the state bucket
    # Use KMS for encryption
    kms_key_id = "arn:aws:kms:us-east-1:123456789:key/abc-123"
  }
}
```

**Prerequisites (Bootstrap Script):**

```bash
#!/bin/bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket myorg-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket myorg-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket myorg-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:us-east-1:123456789:key/abc-123"
      }
    }]
  }'

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## Secrets Management

### ❌ Bad Example (Hardcoded Secrets)

```hcl
resource "aws_db_instance" "main" {
  allocated_storage = 20
  engine           = "postgres"
  
  # NEVER DO THIS!
  username = "admin"
  password = "SuperSecret123!"
}
```

### ❌ Also Bad (Committed .tfvars)

```hcl
# production.tfvars (committed to Git)
db_password = "SuperSecret123!"
```

---

### ✅ Good Example (Environment Variables)

**variables.tf**

```hcl
variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}
```

**main.tf**

```hcl
resource "aws_db_instance" "main" {
  allocated_storage = 20
  engine           = "postgres"
  username         = "dbadmin"
  password         = var.db_password
  
  lifecycle {
    prevent_destroy = true
  }
}
```

**Usage:**

```bash
# Set via environment variable
export TF_VAR_db_password="SuperSecret123!"

# Or pass via command line (not in CI/CD!)
terraform apply -var="db_password=SuperSecret123!"

# Or use secrets manager
terraform apply -var="db_password=$(aws secretsmanager get-secret-value --secret-id prod/db/password --query SecretString --output text)"
```

---

### ✅ Better: Use AWS Secrets Manager

**main.tf**

```hcl
# Generate a random password
resource "random_password" "db_master" {
  length  = 32
  special = true
}

# Store in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "prod/db/master-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_master.result
}

# Use the password
resource "aws_db_instance" "main" {
  allocated_storage = 20
  engine           = "postgres"
  username         = "dbadmin"
  password         = random_password.db_master.result
  
  lifecycle {
    prevent_destroy = true
  }
}

# Mark output as sensitive
output "db_password_secret_arn" {
  value     = aws_secretsmanager_secret.db_password.arn
  sensitive = false  # ARN is not sensitive, but password is
}
```

---

## Module Structure & Versioning

### ✅ Standard Module Structure

```text
terraform-aws-vpc/
├── README.md
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── examples/
│   └── complete/
│       ├── main.tf
│       └── README.md
└── tests/
    └── module_test.go
```

**versions.tf**

```hcl
terraform {
  required_version = ">= 1.5.0, < 2.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

**variables.tf**

```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC (e.g., 10.0.0.0/16)"
  type        = string
  
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "Must be a valid IPv4 CIDR block."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

---

## Protecting Stateful Resources

### ✅ Lifecycle Policies

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "critical-data-${var.environment}"
  
  lifecycle {
    # Prevent accidental deletion
    prevent_destroy = true
    
    # Ignore externally added tags (e.g., by AWS Config)
    ignore_changes = [tags["LastScanned"]]
  }
}

resource "aws_db_instance" "main" {
  identifier           = "prod-db"
  engine              = "postgres"
  instance_class      = "db.r6g.large"
  allocated_storage   = 100
  
  # Protect against accidental deletion
  deletion_protection = true
  
  lifecycle {
    prevent_destroy = true
  }
}
```

---

## for_each vs count

### ❌ Bad (Using count)

```hcl
variable "user_names" {
  type = list(string)
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "users" {
  count = length(var.user_names)
  name  = var.user_names[count.index]
}

# Problem: If you remove "bob" from the list, 
# "charlie" will be destroyed and recreated!
```

---

### ✅ Good (Using for_each)

```hcl
variable "user_names" {
  type = set(string)
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "users" {
  for_each = var.user_names
  name     = each.value
}

# Benefit: Removing "bob" only affects that one user
```

---

## Data Sources for Dynamic Values

### ❌ Bad (Hardcoded AMI)

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"  # Will become outdated!
  instance_type = "t3.micro"
}
```

### ✅ Good (Dynamic Lookup)

```hcl
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"
  
  tags = {
    Name     = "web-server"
    AMI_Name = data.aws_ami.amazon_linux_2.name
  }
}
```

---

## Security Scanning

### Pre-commit Hook Configuration

**.pre-commit-config.yaml**

```yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
      - id: terraform_checkov
        args:
          - --args=--framework terraform
          - --args=--quiet
```

**Install:**

```bash
pip install pre-commit
pre-commit install
```

---

### Manual Scanning

```bash
# Format check
terraform fmt -check -recursive

# Validation
terraform validate

# Security scanning with checkov
checkov -d . --framework terraform

# Alternative: tfsec
tfsec .

# Alternative: terrascan
terrascan scan -t terraform
```

---

## CI/CD Integration

See [examples/ci/terraform-pipeline.yml](../ci/terraform-pipeline.yml) for complete GitHub Actions example.
