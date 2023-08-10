import * as crypto from 'crypto';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const githubWebhookSecret = secret.GITHUB_WEBHOOK_SECRET!;
  const headers = event.headers;
  const signature = headers['X-Hub-Signature'];
  const payload = event.body;
  const expectedSignature = `sha1=${crypto.createHmac('sha1', githubWebhookSecret).update(payload).digest('hex')}`;
  const policy = {
    principalId: null,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: '*',
        },
      ],
    },
  };
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    callback(null, policy);
  } else {
    callback('Unauthorized', null);
  }
};
