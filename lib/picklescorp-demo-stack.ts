import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class PicklesCorpDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // SCENARIO 1: External Access Analyzer
    // ========================================

    // Alice's bucket with cross-account access
    const externalBucket = new s3.Bucket(this, 'AliceExternalBucket', {
      bucketName: `picklescorp-external-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add cross-account access policy (external to our zone of trust)
    externalBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountPrincipal('762337013574')],
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          externalBucket.bucketArn,
          externalBucket.arnForObjects('*')
        ],
      })
    );

    // External Access Analyzer - Created manually during demo
    // This allows you to show attendees how to create and configure analyzers

    // ========================================
    // SCENARIO 2: Unused Access Analyzer
    // ========================================

    // Lambda function with minimal needs
    const demoFunction = new lambda.Function(this, 'AliceDemoFunction', {
      functionName: 'picklescorp-demo-function',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
def handler(event, context):
    # This function only needs S3 read access
    import boto3
    s3 = boto3.client('s3')
    # Simple S3 call to generate CloudTrail logs
    response = s3.list_buckets()
    # In reality, it only reads from one bucket
    return {'statusCode': 200, 'body': 'Hello PicklesCorp!'}
      `),
    });

    // Alice's overly permissive role (attached to Lambda)
    demoFunction.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
    );
    demoFunction.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );
    demoFunction.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess')
    );

    // Alice's IAM user with unused access key
    const aliceUser = new iam.User(this, 'AliceUser', {
      userName: 'picklescorp-alice-dev',
    });

    // Grant permissions to the user
    aliceUser.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
    );

    // Create access key (will be unused for demo)
    const accessKey = new iam.CfnAccessKey(this, 'AliceAccessKey', {
      userName: aliceUser.userName,
    });

    // Unused Access Analyzer - Created manually during demo
    // This allows you to show attendees the configuration options (tracking period, etc.)

    // ========================================
    // SCENARIO 3: Internal Access Analyzer
    // ========================================

    // Critical DynamoDB table with broad internal access
    const criticalTable = new dynamodb.Table(this, 'CriticalCustomerData', {
      tableName: 'picklescorp-critical-customer-data',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add cross-account resource-based policy to DynamoDB table
    const tablePolicy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "CrossAccountAccess",
          "Effect": "Allow",
          "Principal": {
            "AWS": "arn:aws:iam::762337013574:root"
          },
          "Action": [
            "dynamodb:GetItem",
            "dynamodb:BatchGetItem",
            "dynamodb:Query",
            "dynamodb:Scan"
          ],
          "Resource": `arn:aws:dynamodb:${this.region}:${this.account}:table/picklescorp-critical-customer-data`
        }
      ]
    };

    // Attach the resource policy to the table
    const cfnTable = criticalTable.node.defaultChild as dynamodb.CfnTable;
    cfnTable.resourcePolicy = {
      policyDocument: tablePolicy
    };

    // Alice grants broad access to multiple roles
    const devRole = new iam.Role(this, 'DevRole', {
      roleName: 'picklescorp-dev-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    criticalTable.grantReadWriteData(devRole);
    criticalTable.grantReadWriteData(demoFunction);

    // Critical S3 bucket with resource policy allowing internal access
    const criticalBucket = new s3.Bucket(this, 'CriticalDataBucket', {
      bucketName: `picklescorp-critical-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add resource policy allowing account-wide access
    criticalBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountPrincipal(this.account)],
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [criticalBucket.arnForObjects('*')],
      })
    );

    // Internal Access Analyzer - Created manually during demo
    // This allows you to explain zone of trust (account vs organization)

    // ========================================
    // ACT III: Custom Policy Checks Resources
    // ========================================

    // S3 bucket for storing policy documents for CI/CD checks
    const policyBucket = new s3.Bucket(this, 'PolicyDocumentsBucket', {
      bucketName: `picklescorp-policies-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // IAM role for CI/CD pipeline to run custom policy checks
    const pipelineRole = new iam.Role(this, 'PolicyCheckRole', {
      roleName: 'picklescorp-policy-check-role',
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        AccessAnalyzerChecks: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'access-analyzer:CheckNoNewAccess',
                'access-analyzer:CheckAccessNotGranted',
                'access-analyzer:CheckNoPublicAccess',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'ExternalBucketName', {
      value: externalBucket.bucketName,
      description: 'S3 bucket with cross-account access (Scenario 1)',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: demoFunction.functionName,
      description: 'Lambda function with unused permissions (Scenario 2)',
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: demoFunction.role?.roleArn || 'N/A',
      description: 'Lambda role with excessive permissions',
    });

    new cdk.CfnOutput(this, 'AliceUserName', {
      value: aliceUser.userName,
      description: 'IAM user with unused access key (Scenario 2)',
    });

    new cdk.CfnOutput(this, 'AliceAccessKeyId', {
      value: accessKey.ref,
      description: 'Access key ID (unused for demo)',
    });

    new cdk.CfnOutput(this, 'CriticalTableName', {
      value: criticalTable.tableName,
      description: 'Critical DynamoDB table (Scenario 3)',
    });

    new cdk.CfnOutput(this, 'CriticalBucketName', {
      value: criticalBucket.bucketName,
      description: 'Critical S3 bucket with internal access (Scenario 3)',
    });

    new cdk.CfnOutput(this, 'PolicyBucketName', {
      value: policyBucket.bucketName,
      description: 'Bucket for storing policy documents for CI/CD checks',
    });

    // Note: Analyzer ARNs will be created manually during the demo
    // You can retrieve them using: aws accessanalyzer list-analyzers
  }
}
