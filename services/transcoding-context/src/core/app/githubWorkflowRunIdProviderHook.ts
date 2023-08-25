// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. When calling GitHub api to run workflow it returns 204 without specifying
// workflow run id. This hook will be called at the beginning of the workflow to
// set the workflow run id

import * as crypto from 'crypto';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TranscodingJob } from '../domain/TranscodingJob';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const dynamodbTranscodingJobTableName = process.env.DYNAMODB_TRANSCODING_JOB_TABLE_NAME!;
const OK = { statusCode: 200 };

const secretsManager = new SecretsManager({});

const marshallOptions = {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true
  };
    
const translateConfig = { marshallOptions };
    
const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface HandlerParam {
  headers: { [key: string]: string };
  body: string;
}

export const handler = async (event: HandlerParam) => {   
  if (event.headers["content-type"] !== "application/json") {
    throw new InvalidContentTypeError();
  }
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const hookSecret = secret.WORKFLOW_RUN_ID_PROVIDER_HOOK_SECRET!;
  const headers = event.headers;
  const token = headers['Authorization'];
  const payload = event.body;
  if (!crypto.timingSafeEqual(Buffer.from(hookSecret), Buffer.from(token))) {
    throw new InvalidAuthTokenError();
  }
  const payloadObject = JSON.parse(payload);
  const transcodingJobId = payloadObject?.transcodingJobId;
  const githubWorkflowRunId = payloadObject?.githubWorkflowRunId;

  const queryParams = {
    TableName: dynamodbTranscodingJobTableName,
    Key: { 'id': transcodingJobId }
  } as const;
  let data = await docClient.get(queryParams);
  if (data == undefined || data.Item == undefined) {
    throw new FailedToGetTranscodingJobError();
  }
  let transcodingJob = new TranscodingJob(true);
  Object.assign(transcodingJob, data.Item);  
  transcodingJob.setGithubWorkflowRunId(githubWorkflowRunId);
  await docClient.put({ TableName: dynamodbTranscodingJobTableName, Item: transcodingJob });

  return OK;
};

class InvalidContentTypeError extends Error {}

class InvalidAuthTokenError extends Error {}

class FailedToGetTranscodingJobError extends Error {}
