import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { CloudFrontDistroMetadata } from "../domain/CloudFrontDistroMetadata";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { CloudFrontClient, GetDistributionCommand, GetPublicKeyCommand } from '@aws-sdk/client-cloudfront';
import axios from 'axios';

const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;
const testFilePath = process.env.TEST_FILE_PATH!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const sts = new STSClient({});

interface CreateCFDistroParam {
  arn: string;
  assumeRoleArnForMainAccount: string;
  awsAccountNumber: string;
  signerKeyId: string;
}

export const handler = async (event: CreateCFDistroParam): Promise<string> => {
  // 1. With current business logic that doesn't make sense to have multiple cd distros
  //    from same AWS account
  let scanParams = {
    TableName: dynamodbCFDistroMetadataTableName,
    FilterExpression: '#awsAccountNumber = :value',
    ExpressionAttributeNames: { '#awsAccountNumber': 'awsAccountNumber' },
    ExpressionAttributeValues: { ':value': event.awsAccountNumber }
  } as const;
  let data = await docClient.scan(scanParams);
  if (data?.Items != undefined && data?.Items.length != 0) {
    throw new CFMetadataWithAwsAccountNumberExistsError(); 
  }

  // 2. Assume role check
  const assumeRoleCommand = new AssumeRoleCommand({
    RoleArn: event.assumeRoleArnForMainAccount,
    RoleSessionName: `createCloudFrontDistroMetadata-${Date.now()}`,
    DurationSeconds: 3600,
  });
  const assumeRoleResponse = await sts.send(assumeRoleCommand);
  
  // 3. Create CF client with assumed role
  const cloudFront = new CloudFrontClient({
    credentials: {
      accessKeyId: assumeRoleResponse.Credentials?.AccessKeyId!,
      secretAccessKey: assumeRoleResponse.Credentials?.SecretAccessKey!,
      sessionToken: assumeRoleResponse.Credentials?.SessionToken, 
    }
  });

  // 4. Check if signer key exists in the account
  await cloudFront.send(new GetPublicKeyCommand({
    Id: event.signerKeyId
  }))
  
  // 5. Get CF distro
  const cfDistroResponse = await cloudFront.send(new GetDistributionCommand({
    Id: event.arn.substring(event.arn.lastIndexOf('/') + 1, event.arn.length)
  }));

  // 6. Check access to main account s3 bucket
  const testFileResponse = await axios.get(`https://${cfDistroResponse.Distribution?.DomainName}/${testFilePath}`);
  if (testFileResponse.status !== 200) {
    throw new TestFileAccessFailedError();
  }
  

  let cfDistro = new CloudFrontDistroMetadata(false, cfDistroResponse.Distribution?.DomainName, event.arn,
    event.assumeRoleArnForMainAccount, event.awsAccountNumber, event.signerKeyId);

  await docClient.put({TableName: dynamodbCFDistroMetadataTableName, Item: cfDistro});

  return cfDistro.id;
};

class CFMetadataWithAwsAccountNumberExistsError extends Error {};

class TestFileAccessFailedError extends Error {};
