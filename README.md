# PicklesCorp IAM Access Analyzer Demo Infrastructure

This CDK application deploys all AWS resources needed for the IAM Access Analyzer live demo presentation.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm
- AWS CDK CLI (`npm install -g aws-cdk`)

## Quick Start

```bash
# Install dependencies
cd cdk-app
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy the stack
cdk deploy

# View outputs
cdk deploy --outputs-file outputs.json
```

## What Gets Deployed

### Scenario 1: External Access Analyzer
- **S3 Bucket with Cross-Account Access**: Intentionally shared with external AWS account (762337013574)
- **Note**: The analyzer itself is created manually during the demo

### Scenario 2: Unused Access Analyzer
- **Lambda Function**: Simple function with minimal actual needs
- **Overly Permissive Role**: Attached with S3, DynamoDB, and SQS full access
- **IAM User with Unused Access Key**: User with credentials that are never used
- **Note**: The analyzer itself is created manually during the demo

### Scenario 3: Internal Access Analyzer
- **Critical S3 Bucket**: Bucket with account-wide resource policy (primary focus)
- **Critical DynamoDB Table**: Customer data table with broad internal access
- **Multiple IAM Roles**: Dev roles with varying access levels
- **Note**: The analyzer itself is created manually during the demo

### Act III: Custom Policy Checks
- **Policy Documents Bucket**: Stores policy files for CI/CD validation
- **Pipeline Role**: IAM role with permissions to run custom policy checks

## Demo Scripts

After deployment, you'll create analyzers and investigate findings using the provided scripts:

### External Access
```bash
cd ../external-analyzer
./create-analyzer.sh         # Create External Access Analyzer (live demo)
./check-findings.sh          # View external access findings
./remediate-public-bucket.sh # Fix the public bucket
```

### Unused Access
```bash
cd ../unused-access
./create-analyzer.sh         # Create Unused Access Analyzer (live demo)
./check-unused-access.sh     # View unused permissions
./generate-policy.sh         # Generate least-privilege policy
```

### Internal Access
```bash
cd ../internal-analyzer
./create-analyzer.sh         # Create Internal Access Analyzer (live demo)
./check-internal-access.sh   # View internal access findings
./analyze-critical-resource.sh # Analyze specific resource access
```

### Custom Policy Checks
```bash
cd ../custom-policy-checks
./check-no-new-access.sh     # Demo privilege creep prevention
./check-access-not-granted.sh # Demo sensitive action blocking
./check-no-public-access.sh  # Demo public access prevention
```

## Important Notes

1. **Analyzers Not Included**: The CDK stack deploys the "problem" resources but NOT the analyzers themselves. You'll create those manually during the demo using the provided scripts.
2. **Analyzer Findings**: It may take 30-60 minutes after creating analyzers for findings to appear
3. **Unused Access**: The Lambda function needs to run for findings to show "unused" permissions
4. **Organization Analyzers**: For organization-level internal access analysis, deploy in the management account
5. **Costs**: This demo uses resources that may incur AWS charges (minimal for demo purposes)

## Cleanup

```bash
cd cdk-app
cdk destroy
```

## Troubleshooting

- If analyzers don't show findings immediately, wait 30-60 minutes
- Ensure your AWS account has IAM Access Analyzer enabled in the region
- For organization-level features, ensure you're in the management account
- Check CloudFormation console for detailed deployment errors
