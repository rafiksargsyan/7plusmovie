// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. Basically we need infrastracture part that listens to github workflow run
// event and calls application logic. We might also consider this with other handlers.

import * as crypto from 'crypto';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const githubWorkflowId = process.env.TRANSCODING_GITHUB_WORKFLOW_ID!;
const lambdaHook = process.env.LAMBDA_HOOK!;
const OK = { statusCode: 200 };

const secretsManager = new SecretsManager({});
const lambdaClient = new LambdaClient({});

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
  const githubWebhookSecret = secret.GITHUB_WEBHOOK_SECRET!;
  const headers = event.headers;
  const signature = headers['X-Hub-Signature'];
  const payload = event.body;
  const expectedSignature = `sha1=${crypto.createHmac('sha1', githubWebhookSecret).update(payload).digest('hex')}`;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new SignatureMismatchError();
  }
  const payloadObject = JSON.parse(payload);
  if (payloadObject?.workflow_run?.workflow_id !== Number(githubWorkflowId)) {
    console.log(`workflow_id = ${payloadObject?.workflow_run?.workflow_id}`);
    return OK;
  }
  const action = payloadObject?.action;
  const status = payloadObject?.workflow_run?.status;
  const conclusion = payloadObject?.workflow_run?.concluion;
  const workflowRunId = payloadObject?.workflow_run?.id;
  const runAttempt = payloadObject?.workflow_run?.run_attempt;
  const rerunUrl = payloadObject?.workflow_run?.rerun_url;
  console.log(action);
  console.log(status);
  console.log(conclusion);
  console.log(workflowRunId);
  console.log(runAttempt);
  console.log(rerunUrl);
  if (status == 'completed' && conclusion == 'success') {
    const transcodingJobParams = {
      FunctionName: lambdaHook,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ transcodingContextJobId: workflowRunId })
    };
    const invokeCommand = new InvokeCommand(transcodingJobParams);
    const response = await lambdaClient.send(invokeCommand);
    console.log(JSON.stringify(response));
  } 
  return OK;
};

class InvalidContentTypeError extends Error {}

class SignatureMismatchError extends Error {}
