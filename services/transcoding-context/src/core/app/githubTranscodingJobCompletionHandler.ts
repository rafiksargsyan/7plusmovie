// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. Basically we need infrastracture part that listens to github workflow run
// event and calls application logic. We might also consider this with other handlers.

import * as crypto from 'crypto';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const githubWorkflowId = process.env.TRANSCODING_GITHUB_WORKFLOW_ID!;
const dynamodbTranscodingJobTableName = process.env.DYNAMODB_TRANSCODING_JOB_TABLE_NAME!;
const lambdaHook = process.env.LAMBDA_HOOK!;
const OK = { statusCode: 200 };

const secretsManager = new SecretsManager({});
const lambdaClient = new LambdaClient({});

const marshallOptions = {
    convertClassInstanceToMap: true
  };
    
  const translateConfig = { marshallOptions };
    
  const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface HandlerParam {
  headers: { [key: string]: string };
  body: string;
}

interface TranscodingJobRead {
  id?: string;
}

export const handler = async (event: HandlerParam) => {   
  if (event.headers["content-type"] !== "application/json") {
    throw new InvalidContentTypeError();
  }
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const githubWebhookSecret = secret.GITHUB_WEBHOOK_SECRET!;
  const headers = event.headers;
  const signature = headers['X-Hub-Signature'];
  const payload = event.body;
  const expectedSignature = `sha1=${crypto.createHmac('sha1', githubWebhookSecret).update(payload).digest('hex')}`;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new SignatureMismatchError();
  }
  const payloadObject = JSON.parse(payload);
  const workflowRunId = payloadObject?.workflow_run?.id;
  const workflowId = payloadObject?.workflow?.id;
  if (workflowId !== Number(githubWorkflowId)) {
    return OK;
  }

  const status = payloadObject?.workflow_run?.status;
  const conclusion = payloadObject?.workflow_run?.conclusion;

  const scanParams = {
    TableName: dynamodbTranscodingJobTableName,
    FilterExpression: '#githubWorkflowRunId = :value',
    ExpressionAttributeNames: { '#githubWorkflowRunId': 'githubWorkflowRunId' },
    ExpressionAttributeValues: { ':value': workflowRunId }
  } as const;
  let data = await docClient.scan(scanParams);
  if (data == undefined || data.Items == undefined || data.Items.length == 0) {
    throw new FailedToGetTranscodingJobError();
  }
  let transcodingJobRead: TranscodingJobRead = {};
  Object.assign(transcodingJobRead, data.Items[0]);

  if (status == 'completed' && conclusion == 'success') {
    const transcodingJobParams = {
      FunctionName: lambdaHook,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ transcodingContextJobId: transcodingJobRead.id })
    };
    const invokeCommand = new InvokeCommand(transcodingJobParams);
    const response = await lambdaClient.send(invokeCommand);
  } 
  return OK;
};

class InvalidContentTypeError extends Error {}

class SignatureMismatchError extends Error {}

class FailedToGetTranscodingJobError extends Error {}
