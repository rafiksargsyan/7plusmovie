import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { CloudFrontDistroMetadata } from "../domain/CloudFrontDistroMetadata";

const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;
const testFilePath = process.env.TEST_FILE_PATH!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

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
  //       3. Check if CloudFront distro with the same aws account already exists
  let cfDistro = new CloudFrontDistroMetadata(false, event.domain, event.arn,
    event.assumeRoleArnForMainAccount, event.awsAccountNumber, event.signerKeyId);

  await docClient.put({TableName: dynamodbCFDistroMetadataTableName, Item: cfDistro});

  return cfDistro.id;
};
