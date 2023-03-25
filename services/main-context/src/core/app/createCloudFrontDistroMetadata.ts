import { DynamoDB } from 'aws-sdk';
import { CloudFrontDistroMetadata } from "../domain/CloudFrontDistroMetadata";

const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;
const testFilePath = process.env.TEST_FILE_PATH!;

const docClient = new DynamoDB.DocumentClient();

interface CreateCFDistroParam {
  domain: string;
  arn: string;
  assumeRoleArnForMainAccount: string;
  awsAccountNumber: string;
  signerKeyId: string;
}

export const handler = async (event: CreateCFDistroParam): Promise<string> => {
  // TODO: 1. Actually create presigned url or cookies using testFilePath and make http call to the url
  //       2. Also check that assume role works   
  let cfDistro = new CloudFrontDistroMetadata(false, event.domain, event.arn,
    event.assumeRoleArnForMainAccount, event.awsAccountNumber, event.signerKeyId);

  await docClient.put({TableName: dynamodbCFDistroMetadataTableName, Item: cfDistro}).promise();

  return cfDistro.id;
};
