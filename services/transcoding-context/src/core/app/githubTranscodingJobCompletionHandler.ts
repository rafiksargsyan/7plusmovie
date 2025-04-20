// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. Basically we need infrastracture part that listens to github workflow run
// event and calls application logic. We might also consider this with other handlers.

import * as crypto from 'crypto';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { Octokit } from '@octokit/rest';
import * as unzipper from "unzipper";
import { Nullable } from '../domain/Nullable';
import axios from 'axios';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const githubWorkflowId = process.env.TRANSCODING_GITHUB_WORKFLOW_ID!;
const dynamodbTranscodingJobTableName = process.env.DYNAMODB_TRANSCODING_JOB_TABLE_NAME!;
const lambdaHook = process.env.LAMBDA_HOOK!;
const OK = { statusCode: 200 };
const githubOwner = process.env.GITHUB_OWNER!;
const githubRepo = process.env.GITHUB_REPO!;

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
  if (event.headers["content-type"] !== "application/json" &&
      event.headers["Content-Type"] !== "application/json") {
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

  if (status == 'completed') {
    let payload;
    if (conclusion === 'success') {
      payload = {
        transcodingContextJobId: transcodingJobRead.id,
        isSuccess: true
      }
    } else if (conclusion === 'failure') {
      const octokit = new Octokit({
        auth: secret.GITHUB_PAT!,
      });
      payload = {
        transcodingContextJobId: transcodingJobRead.id,
        isSuccess: false,
        invalidVttFileName: await findInvalidVttFile(octokit, githubOwner, githubRepo, workflowRunId)
      }
    }
    const transcodingJobParams = {
      FunctionName: lambdaHook,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    };
    const invokeCommand = new InvokeCommand(transcodingJobParams);
    await lambdaClient.send(invokeCommand);
  } 
  return OK;
};

async function findInvalidVttFile(octokit: Octokit, githubOwner: string,
  githubRepo: string, workflowRunId: number): Promise<Nullable<string>> {
  let ret;
  try {
    const { url } = await octokit.request(`GET /repos/${githubOwner}/${githubRepo}/actions/runs/${workflowRunId}/logs`)
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    const directory = await unzipper.Open.buffer(Buffer.from(response.data));

    for (const file of directory.files) {
      if (
        file.path.includes('7_Transcode.txt') ||
        file.path.includes('get-transcode-and-publish.txt')
      ) {
        const content = await file.buffer();
        const text = content.toString('utf-8');
        const match = text.match(/E\d+\s.*\(PARSER_FAILURE\): Cannot parse media file .*\/([^\/]+\.vtt)/);
        if (match) {
          ret = match[1];
          break;
        }
      }
    }
  } catch (e) {
    console.error(`Failed while trying to find invalid VTT file: ${JSON.stringify(e)}`);
  }
  return ret;
}

class InvalidContentTypeError extends Error {}

class SignatureMismatchError extends Error {}

class FailedToGetTranscodingJobError extends Error {}
