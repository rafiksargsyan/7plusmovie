// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. Basically we need infrastracture part that listens to github workflow run
// event and calls application logic. We might also consider this with other handlers.

import * as crypto from 'crypto';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const githubWorkflowId = process.env.TRANSCODING_GITHUB_WORKFLOW_ID!;
const OK = { statusCode: 200 };

const secretsManager = new SecretsManager({});

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
    return OK;
  }
  const action = payloadObject?.action;
  const status = payloadObject?.workflow_run?.status;
  const conclusion = payloadObject?.workflow_run?.concluion;
  const workflowRunId = payloadObject?.workflow_run?.id;
  const runAttempt = payloadObject?.workflow_run?.run_attempt;
  const rerunUrl = payloadObject?.workflow_run?.rerun_url;

  return OK;
};

class InvalidContentTypeError extends Error {}

class SignatureMismatchError extends Error {}
