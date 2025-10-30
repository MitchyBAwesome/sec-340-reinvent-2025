# PicklesCorp IAM Access Analyzer Demo - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PicklesCorp AWS Account                                 │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ SCENARIO 1: External Access Analyzer                                     │   │
│  │                                                                           │   │
│  │  ┌──────────────────────────────────────┐                                │   │
│  │  │  S3: AliceExternalBucket             │                                │   │
│  │  │  picklescorp-external-{account}      │◄───────────────────────────────┼───┼──┐
│  │  │                                       │  Cross-Account Access          │   │  │
│  │  │  • Block Public Access: ALL          │  (GetObject, ListBucket)       │   │  │
│  │  │  • Auto-delete enabled               │                                │   │  │
│  │  └──────────────────────────────────────┘                                │   │  │
│  │                                                                           │   │  │
│  │  📊 External Access Analyzer (Manual Setup)                              │   │  │
│  │     → Detects cross-account access                                       │   │  │
│  └─────────────────────────────────────────────────────────────────────────┘   │  │
│                                                                                   │  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │  │
│  │ SCENARIO 2: Unused Access Analyzer                                       │   │  │
│  │                                                                           │   │  │
│  │  ┌──────────────────────────────────────┐                                │   │  │
│  │  │  Lambda: AliceDemoFunction           │                                │   │  │
│  │  │  picklescorp-demo-function           │                                │   │  │
│  │  │                                       │                                │   │  │
│  │  │  • Runtime: Python 3.12              │                                │   │  │
│  │  │  • Actual Need: S3 Read Only         │                                │   │  │
│  │  └──────────────┬───────────────────────┘                                │   │  │
│  │                 │                                                         │   │  │
│  │                 │ Attached Role with EXCESSIVE Permissions:              │   │  │
│  │                 ▼                                                         │   │  │
│  │  ┌──────────────────────────────────────┐                                │   │  │
│  │  │  IAM Role (Lambda Execution Role)    │                                │   │  │
│  │  │                                       │                                │   │  │
│  │  │  ❌ AmazonS3FullAccess               │                                │   │  │
│  │  │  ❌ AmazonDynamoDBFullAccess         │                                │   │  │
│  │  │  ❌ AmazonSQSFullAccess              │                                │   │  │
│  │  └──────────────────────────────────────┘                                │   │  │
│  │                                                                           │   │  │
│  │  📊 Unused Access Analyzer (Manual Setup)                                │   │  │
│  │     → Identifies unused permissions                                      │   │  │
│  └─────────────────────────────────────────────────────────────────────────┘   │  │
│                                                                                   │  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │  │
│  │ SCENARIO 3: Internal Access Analyzer                                     │   │  │
│  │                                                                           │   │  │
│  │  ┌──────────────────────────────────────┐                                │   │  │
│  │  │  DynamoDB: CriticalCustomerData      │                                │   │  │
│  │  │  picklescorp-critical-customer-data  │                                │   │  │
│  │  │                                       │                                │   │  │
│  │  │  • Partition Key: customerId         │                                │   │  │
│  │  └──────────────┬───────────────────────┘                                │   │  │
│  │                 │                                                         │   │  │
│  │                 │ Read/Write Access Granted To:                          │   │  │
│  │                 ├──────────────────────────────┐                         │   │  │
│  │                 ▼                              ▼                         │   │  │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐            │   │  │
│  │  │  IAM: DevRole            │  │  Lambda Function Role    │            │   │  │
│  │  │  picklescorp-dev-role    │  │  (from Scenario 2)       │            │   │  │
│  │  └──────────────────────────┘  └──────────────────────────┘            │   │  │
│  │                                                                           │   │  │
│  │  ┌──────────────────────────────────────┐                                │   │  │
│  │  │  S3: CriticalDataBucket              │                                │   │  │
│  │  │  picklescorp-critical-{account}      │                                │   │  │
│  │  │                                       │                                │   │  │
│  │  │  • Block Public Access: ALL          │                                │   │  │
│  │  │  • Account-wide access policy        │                                │   │  │
│  │  │    (GetObject, PutObject, Delete)    │                                │   │  │
│  │  └──────────────────────────────────────┘                                │   │  │
│  │                                                                           │   │  │
│  │  📊 Internal Access Analyzer (Manual Setup)                              │   │  │
│  │     → Monitors internal access patterns                                  │   │  │
│  └─────────────────────────────────────────────────────────────────────────┘   │  │
│                                                                                   │  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │  │
│  │ ACT III: Custom Policy Checks (CI/CD Integration)                        │   │  │
│  │                                                                           │   │  │
│  │  ┌──────────────────────────────────────┐                                │   │  │
│  │  │  S3: PolicyDocumentsBucket           │                                │   │  │
│  │  │  picklescorp-policies-{account}      │                                │   │  │
│  │  │                                       │                                │   │  │
│  │  │  • Versioning: Enabled               │                                │   │  │
│  │  │  • Stores policy documents           │                                │   │  │
│  │  └──────────────────────────────────────┘                                │   │  │
│  │                                                                           │   │  │
│  │  ┌──────────────────────────────────────┐                                │   │  │
│  │  │  IAM: PolicyCheckRole                │                                │   │  │
│  │  │  picklescorp-policy-check-role       │                                │   │  │
│  │  │                                       │                                │   │  │
│  │  │  Permissions:                         │                                │   │  │
│  │  │  • CheckNoNewAccess                  │                                │   │  │
│  │  │  • CheckAccessNotGranted             │                                │   │  │
│  │  │  • CheckNoPublicAccess               │                                │   │  │
│  │  └──────────────────────────────────────┘                                │   │  │
│  │                                                                           │   │  │
│  │  🔄 Used by CI/CD Pipeline for policy validation                         │   │  │
│  └─────────────────────────────────────────────────────────────────────────┘   │  │
│                                                                                   │  │
└───────────────────────────────────────────────────────────────────────────────────┘  │
                                                                                        │
┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  External AWS Account: 762337013574                                               │ │
│                                                                                     │ │
│  🔑 Has access to AliceExternalBucket                                             │◄┘
│     (GetObject, ListBucket permissions)                                            │
│                                                                                     │
└───────────────────────────────────────────────────────────────────────────────────┘


## Architecture Summary

### Resources Created:

**Scenario 1 - External Access Detection:**
- 1x S3 Bucket (with cross-account access to account 762337013574)

**Scenario 2 - Unused Access Detection:**
- 1x Lambda Function (Python 3.12)
- 1x IAM Role (with 3 overly-permissive managed policies)

**Scenario 3 - Internal Access Monitoring:**
- 1x DynamoDB Table (customer data)
- 1x S3 Bucket (critical data with account-wide access)
- 1x IAM Role (dev role with table access)

**Act III - CI/CD Policy Validation:**
- 1x S3 Bucket (versioned, for policy documents)
- 1x IAM Role (for running Access Analyzer policy checks)

### Key Security Patterns Demonstrated:

1. **Cross-Account Access** - External bucket shared with another AWS account
2. **Over-Permissioned Roles** - Lambda with full access to S3, DynamoDB, and SQS (only needs S3 read)
3. **Broad Internal Access** - Critical resources accessible account-wide
4. **Policy Validation** - CI/CD integration for automated security checks

### Access Analyzers (Created Manually):
- External Access Analyzer → Detects resources shared outside zone of trust
- Unused Access Analyzer → Identifies unused IAM permissions
- Internal Access Analyzer → Monitors access patterns within zone of trust
```
