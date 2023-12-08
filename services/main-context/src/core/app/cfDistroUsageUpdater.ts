import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { CloudWatchClient, GetMetricStatisticsCommand, Statistic } from '@aws-sdk/client-cloudwatch';
import { CloudFrontDistroMetadata } from "../domain/CloudFrontDistroMetadata";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const sts = new STSClient({});

interface CloudFrontDistroRead {
  arn: string;
  assumeRoleArnForMainAccount: string;
}

export const handler = async (): Promise<void> => {
  const cfDistros = await getAllCfDistros();  
  for (const _ of cfDistros) {
    const arn = (_ as unknown as CloudFrontDistroRead).arn;
    const assumeRoleArn = (_ as unknown as CloudFrontDistroRead).assumeRoleArnForMainAccount;
    const cfDistroId = arn.match(/distribution\/(.*)/)![1];
    try {
      _.setUsageInBytesForTheMonth(await getUsageForCFDistro(assumeRoleArn, cfDistroId));
    } catch (e) {
      console.error(`Failed to retrieve usage for cfDistroId = ${cfDistroId}:`, e);  
    }
  }
  const cfDistrosLength = cfDistros.length;
  for (let i = 0; i < cfDistrosLength; i += 25) {
    const batchItems: {PutRequest: { Item: CloudFrontDistroMetadata}}[] = [];
    for (let j = i; j < i + 25 && j < cfDistrosLength; ++j) {
      batchItems.push({
        PutRequest: {
          Item: cfDistros[j]
        }
      })   
    }
    try {
      await docClient.batchWrite({
        RequestItems: {
          [dynamodbCFDistroMetadataTableName]: batchItems
        }
      })
    } catch (e) {
      console.error("Failed to batch save CF distro metadata:", e);
    }
  }
};

async function getAllCfDistros(): Promise<CloudFrontDistroMetadata[]> {
  const cfDistros: CloudFrontDistroMetadata[] = [];
  const params = {
    TableName: dynamodbCFDistroMetadataTableName,
    ExclusiveStartKey: undefined
  }
  let items;
  do {
    items =  await docClient.scan(params);
    items.Items.forEach((item) => {
      const cfDistro = new CloudFrontDistroMetadata(true);
      Object.assign(cfDistro, item);
      cfDistros.push(cfDistro);
    });
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");
  return cfDistros;
}

async function getUsageForCFDistro(assumeRoleArn, cfDistroId) {
  const assumeRoleCommand = new AssumeRoleCommand({
    RoleArn: assumeRoleArn,
    RoleSessionName: `cfDistroUsageUpdater-${Date.now()}`,
    DurationSeconds: 3600,
  });
  const assumeRoleResponse = await sts.send(assumeRoleCommand);  
  const cloudWatch = new CloudWatchClient({
    credentials: {
      accessKeyId: assumeRoleResponse.Credentials?.AccessKeyId!,
      secretAccessKey: assumeRoleResponse.Credentials?.SecretAccessKey!,
      sessionToken: assumeRoleResponse.Credentials?.SessionToken
    },
    region: 'us-east-1', // CloudWatch metrics are typically in us-east-1
  });
  
  const currentDate = new Date();
  const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // beginning of the month
  const endTime = new Date();
  
  const getMetricStatisticsCommandInput = {
    Namespace: 'AWS/CloudFront',
    MetricName: 'BytesDownloaded',
    Dimensions: [
      { Name: 'DistributionId', Value: cfDistroId },
      { Name: 'Region', Value: 'Global' },
    ],
    StartTime: startTime,
    EndTime: endTime,
    Period: 86400,
    Statistics: [Statistic.Sum],
  };
  
  const cloudWatchResponse = await cloudWatch.send(new GetMetricStatisticsCommand(getMetricStatisticsCommandInput));
  
  const totalBytes = cloudWatchResponse?.Datapoints?.reduce((sum, datapoint) => {
    if (datapoint.Sum != undefined) {
      return sum + datapoint.Sum
    } else {
      console.warn(`Received undefined datapoint for cfDistroId = ${cfDistroId}`);
      return sum;  
    }},
  0);
  
  if (totalBytes == undefined) {
    throw new CfDistroUndefinedUsageError();
  }

  return totalBytes;
}

class CfDistroUndefinedUsageError extends Error {}
