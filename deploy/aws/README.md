# AWS Deployment Bootstrap Runbook

Status: Draft. Do not run create/update/delete commands without explicit approval.

## Fixed Decisions

- Region: `ap-northeast-2`
- EC2 instance type: `t4g.micro`
- EC2 OS: Amazon Linux 2023 ARM64
- ECR repository: `trading-back`
- CodeDeploy application: `trading-back`
- CodeDeploy deployment group: `trading-back-prod`
- Back Parameter Store path: `/trading/prod/back`
- Back container name: `trading-back`
- EC2 inbound: no inbound rules
- Operator access: SSM Session Manager, not SSH

## Values To Fill

```text
AWS_ACCOUNT_ID=<your aws account id>
GITHUB_OWNER=<github owner>
GITHUB_REPO=<github repository>
ARTIFACT_BUCKET=<globally unique s3 bucket name>
VPC_CIDR=10.0.0.0/16
PUBLIC_SUBNET_CIDR=10.0.1.0/24
AVAILABILITY_ZONE=ap-northeast-2a
VPC_ID=<created vpc id>
INTERNET_GATEWAY_ID=<created internet gateway id>
ROUTE_TABLE_ID=<created route table id>
SUBNET_ID=<created public subnet id>
SECURITY_GROUP_ID=<created security group id>
AMI_ID=<latest Amazon Linux 2023 ARM64 AMI id>
```

Do not commit filled account IDs, real bucket names if they reveal the account, or secrets.

## AWS Resources

1. IAM OIDC provider for GitHub Actions
   - URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
2. IAM role for GitHub Actions
   - Role name: `trading-github-actions-deploy`
   - Trust policy:
     `deploy/aws/iam/github-actions-deploy-trust-policy.json`
   - Permission policy:
     `deploy/aws/iam/github-actions-deploy-permissions.json`
3. ECR repository
   - Name: `trading-back`
   - Image tag mutability: immutable preferred
   - Scan on push: enabled
4. S3 bucket for CodeDeploy revision zip
   - Name: `$ARTIFACT_BUCKET`
   - Public access: block all
   - Versioning: enabled
   - Lifecycle: expire old `codedeploy/trading-back/*` artifacts
5. IAM role for EC2 instance profile
   - Role name: `trading-back-ec2`
   - Trust policy:
     `deploy/aws/iam/ec2-instance-trust-policy.json`
   - Attach AWS managed policy: `AmazonSSMManagedInstanceCore`
   - Attach custom policy:
     `deploy/aws/iam/ec2-instance-permissions.json`
6. IAM service role for CodeDeploy
   - Role name: `trading-codedeploy-service`
   - Trust policy:
     `deploy/aws/iam/codedeploy-service-trust-policy.json`
   - Attach AWS managed policy: `AWSCodeDeployRole`
7. VPC networking
   - VPC CIDR: `10.0.0.0/16`
   - Public subnet CIDR: `10.0.1.0/24`
   - Availability Zone: `ap-northeast-2a`
   - Internet Gateway: required for public subnet outbound internet
   - Route table: `0.0.0.0/0` to Internet Gateway
8. EC2 security group
   - Name: `trading-back-prod`
   - Inbound: empty
   - Outbound: allow required internet egress
9. EC2 instance
   - Instance type: `t4g.micro`
   - AMI: Amazon Linux 2023 ARM64
   - IAM instance profile: `trading-back-ec2`
   - Security group inbound: empty
   - Tags:
     - `Project=trading`
     - `Environment=prod`
     - `CodeDeployGroup=trading-back-prod`
10. CodeDeploy application and deployment group

- Application name: `trading-back`
- Compute platform: `Server`
- Deployment group: `trading-back-prod`
- Service role: `trading-codedeploy-service`
- EC2 tag filter:
  `CodeDeployGroup=trading-back-prod`

11. Parameter Store

- SecureString parameters under `/trading/prod/back/*`
- One parameter leaf name becomes one env key in `/opt/trading/back/.env`

## Command Order

These commands are a runbook shape only. Do not run them until approved.

The IAM JSON files contain placeholders such as `<AWS_ACCOUNT_ID>` and
`<CODEDEPLOY_ARTIFACT_BUCKET>`. Render temporary filled copies outside git before using
`file://...` with AWS CLI.

### 1. Create GitHub OIDC Provider

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

Skip this if the provider already exists. IAM can retrieve the OIDC provider
thumbprint when omitted. If the AWS CLI or account policy requires
`--thumbprint-list`, verify the current GitHub OIDC thumbprint before adding it.

### 2. Create IAM Roles And Policies

```bash
aws iam create-role \
  --role-name trading-github-actions-deploy \
  --assume-role-policy-document file://deploy/aws/iam/github-actions-deploy-trust-policy.json

aws iam put-role-policy \
  --role-name trading-github-actions-deploy \
  --policy-name trading-github-actions-deploy \
  --policy-document file://deploy/aws/iam/github-actions-deploy-permissions.json

aws iam create-role \
  --role-name trading-back-ec2 \
  --assume-role-policy-document file://deploy/aws/iam/ec2-instance-trust-policy.json

aws iam attach-role-policy \
  --role-name trading-back-ec2 \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

aws iam put-role-policy \
  --role-name trading-back-ec2 \
  --policy-name trading-back-ec2 \
  --policy-document file://deploy/aws/iam/ec2-instance-permissions.json

aws iam create-instance-profile \
  --instance-profile-name trading-back-ec2

aws iam add-role-to-instance-profile \
  --instance-profile-name trading-back-ec2 \
  --role-name trading-back-ec2

aws iam create-role \
  --role-name trading-codedeploy-service \
  --assume-role-policy-document file://deploy/aws/iam/codedeploy-service-trust-policy.json

aws iam attach-role-policy \
  --role-name trading-codedeploy-service \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole
```

### 3. Create ECR

```bash
aws ecr create-repository \
  --repository-name trading-back \
  --region ap-northeast-2 \
  --image-scanning-configuration scanOnPush=true \
  --image-tag-mutability IMMUTABLE
```

### 4. Create S3 Artifact Bucket

```bash
aws s3api create-bucket \
  --bucket "$ARTIFACT_BUCKET" \
  --region ap-northeast-2 \
  --create-bucket-configuration LocationConstraint=ap-northeast-2

aws s3api put-public-access-block \
  --bucket "$ARTIFACT_BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-versioning \
  --bucket "$ARTIFACT_BUCKET" \
  --versioning-configuration Status=Enabled
```

### 5. Create CodeDeploy App And Deployment Group

```bash
aws deploy create-application \
  --application-name trading-back \
  --compute-platform Server \
  --region ap-northeast-2
```

Create the deployment group after the CodeDeploy service role exists. It can be created
before or after the EC2 instance, because it targets EC2 by tag.

```bash
aws deploy create-deployment-group \
  --application-name trading-back \
  --deployment-group-name trading-back-prod \
  --service-role-arn arn:aws:iam::$AWS_ACCOUNT_ID:role/trading-codedeploy-service \
  --ec2-tag-filters Key=CodeDeployGroup,Value=trading-back-prod,Type=KEY_AND_VALUE \
  --deployment-config-name CodeDeployDefault.OneAtATime \
  --auto-rollback-configuration enabled=true,events=DEPLOYMENT_FAILURE \
  --region ap-northeast-2
```

### 6. Create VPC Networking

The current Seoul account state has no existing VPC/subnet to reuse. Create one small VPC
for this deployment.

VPC, subnet, route table, and internet gateway do not add the monthly cost by themselves.
The always-on cost in this network path is the EC2 public IPv4 address.

```bash
aws ec2 create-vpc \
  --cidr-block "$VPC_CIDR" \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Project,Value=trading},{Key=Environment,Value=prod},{Key=Name,Value=trading-prod}]' \
  --region ap-northeast-2
```

Record the returned VPC id as `VPC_ID`.

```bash
aws ec2 modify-vpc-attribute \
  --vpc-id "$VPC_ID" \
  --enable-dns-support '{"Value":true}' \
  --region ap-northeast-2

aws ec2 modify-vpc-attribute \
  --vpc-id "$VPC_ID" \
  --enable-dns-hostnames '{"Value":true}' \
  --region ap-northeast-2

aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Project,Value=trading},{Key=Environment,Value=prod},{Key=Name,Value=trading-prod}]' \
  --region ap-northeast-2
```

Record the returned internet gateway id as `INTERNET_GATEWAY_ID`.

```bash
aws ec2 attach-internet-gateway \
  --vpc-id "$VPC_ID" \
  --internet-gateway-id "$INTERNET_GATEWAY_ID" \
  --region ap-northeast-2

aws ec2 create-subnet \
  --vpc-id "$VPC_ID" \
  --cidr-block "$PUBLIC_SUBNET_CIDR" \
  --availability-zone "$AVAILABILITY_ZONE" \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Project,Value=trading},{Key=Environment,Value=prod},{Key=Name,Value=trading-prod-public-a}]' \
  --region ap-northeast-2
```

Record the returned subnet id as `SUBNET_ID`.

```bash
aws ec2 modify-subnet-attribute \
  --subnet-id "$SUBNET_ID" \
  --map-public-ip-on-launch \
  --region ap-northeast-2

aws ec2 create-route-table \
  --vpc-id "$VPC_ID" \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Project,Value=trading},{Key=Environment,Value=prod},{Key=Name,Value=trading-prod-public}]' \
  --region ap-northeast-2
```

Record the returned route table id as `ROUTE_TABLE_ID`.

```bash
aws ec2 create-route \
  --route-table-id "$ROUTE_TABLE_ID" \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id "$INTERNET_GATEWAY_ID" \
  --region ap-northeast-2

aws ec2 associate-route-table \
  --subnet-id "$SUBNET_ID" \
  --route-table-id "$ROUTE_TABLE_ID" \
  --region ap-northeast-2
```

### 7. Create EC2 Security Group

Use a public subnet because this architecture does not use NAT Gateway. Keep inbound empty.

```bash
aws ec2 create-security-group \
  --group-name trading-back-prod \
  --description "trading back prod; no inbound" \
  --vpc-id "$VPC_ID" \
  --region ap-northeast-2
```

Record the returned group id as `SECURITY_GROUP_ID`.

Do not add inbound rules.

### 8. Resolve Latest Amazon Linux 2023 ARM64 AMI

This is a read-only lookup. Do not hard-code an old AMI id.

```bash
aws ssm get-parameter \
  --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64 \
  --region ap-northeast-2 \
  --query Parameter.Value \
  --output text
```

Record the returned value as `AMI_ID`.

### 9. Launch EC2

Create EC2 after the instance profile exists.

Required settings:

- AMI: Amazon Linux 2023 ARM64
- Instance type: `t4g.micro`
- IAM instance profile: `trading-back-ec2`
- Security group inbound: empty
- Public IPv4: yes, for outbound internet without NAT Gateway
- Tags:
  - `Project=trading`
  - `Environment=prod`
  - `CodeDeployGroup=trading-back-prod`

```bash
aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type t4g.micro \
  --subnet-id "$SUBNET_ID" \
  --security-group-ids "$SECURITY_GROUP_ID" \
  --iam-instance-profile Name=trading-back-ec2 \
  --associate-public-ip-address \
  --metadata-options HttpEndpoint=enabled,HttpTokens=required \
  --block-device-mappings DeviceName=/dev/xvda,Ebs="{VolumeSize=10,VolumeType=gp3,DeleteOnTermination=true,Encrypted=true}" \
  --tag-specifications \
  'ResourceType=instance,Tags=[{Key=Project,Value=trading},{Key=Environment,Value=prod},{Key=CodeDeployGroup,Value=trading-back-prod},{Key=Name,Value=trading-back-prod}]' \
  'ResourceType=volume,Tags=[{Key=Project,Value=trading},{Key=Environment,Value=prod},{Key=Name,Value=trading-back-prod}]' \
  --region ap-northeast-2
```

Do not pass a key pair unless SSH is deliberately added later. The intended operator path is
SSM Session Manager.

### 10. Bootstrap EC2 Host

Use SSM Session Manager after the instance appears as a managed node.

Install only host runtime dependencies. Do not build the app on EC2.

```bash
sudo dnf update -y
sudo dnf install -y docker nodejs20 ruby wget
sudo systemctl enable --now docker

cd /home/ec2-user
wget https://aws-codedeploy-ap-northeast-2.s3.ap-northeast-2.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo systemctl enable --now codedeploy-agent

sudo mkdir -p /opt/trading/back
sudo chmod 700 /opt/trading /opt/trading/back

aws --version
node --version
docker --version
sudo systemctl status docker --no-pager
sudo systemctl status codedeploy-agent --no-pager
```

Amazon Linux 2023 includes AWS CLI v2, but still verify `aws --version`.

### 11. Store Back Runtime Parameters

Store each production env value as a separate SecureString under `/trading/prod/back`.
Do not put secret values in this repo, workflow files, or command history.

Manage these parameters directly in AWS Parameter Store. The deploy pipeline does
not read repository env files and does not keep back runtime secrets in GitHub Actions.
Create or update each value as a SecureString before deploying the app.

The deploy hook reads the full path with:

```bash
aws ssm get-parameters-by-path \
  --path /trading/prod/back \
  --with-decryption \
  --recursive \
  --region ap-northeast-2
```

## GitHub Actions Variables

Set these repository variables after AWS resources exist:

```text
AWS_REGION=ap-northeast-2
AWS_DEPLOY_ROLE_ARN=arn:aws:iam::$AWS_ACCOUNT_ID:role/trading-github-actions-deploy
ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com
ECR_BACK_REPOSITORY=trading-back
CODEDEPLOY_ARTIFACT_BUCKET=$ARTIFACT_BUCKET
CODEDEPLOY_APPLICATION_NAME=trading-back
CODEDEPLOY_DEPLOYMENT_GROUP_NAME=trading-back-prod
```

## Verification

1. GitHub OIDC role can be assumed only from `main` of the target repo.
2. GitHub Actions can push `linux/arm64` image to ECR.
3. S3 artifact upload succeeds under `codedeploy/trading-back/`.
4. EC2 appears in SSM managed instances.
5. EC2 has no inbound security group rules.
6. CodeDeploy deployment group sees exactly the intended EC2 instance by tag.
7. CodeDeploy agent runs on EC2.
8. EC2 can pull the ECR image and read `/trading/prod/back` parameters.
9. `deploy/codedeploy/deploy.mjs` starts `trading-back` bound to `127.0.0.1`.

## AWS Documentation Basis

- GitHub Actions should use AWS OIDC instead of long-term AWS keys.
- OIDC trust policy should restrict `token.actions.githubusercontent.com:sub` to
  the intended repository and branch.
- CodeDeploy EC2/On-Premises service role should use the AWS managed
  `AWSCodeDeployRole` policy.
- CodeDeploy agent on EC2 needs instance profile access to the deployment
  revision S3 bucket.
- Amazon Linux 2023 supports installing Docker with `yum install docker` /
  `dnf install docker`, and AL2023 includes AWS CLI v2.
