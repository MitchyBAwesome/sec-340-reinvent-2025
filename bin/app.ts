#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PicklesCorpDemoStack } from '../lib/picklescorp-demo-stack';

const app = new cdk.App();
new PicklesCorpDemoStack(app, 'PicklesCorpDemoStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
