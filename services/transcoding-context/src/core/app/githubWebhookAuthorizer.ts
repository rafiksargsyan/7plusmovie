import * as crypto from 'crypto';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const handler = async (event, context, callback) => {
    const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
    const secret = JSON.parse(secretStr.SecretString!);
    const githubWebhookSecret = secret.GITHUB_WEBHOOK_SECRET!;

    const headers = event.headers;
    const signature = headers['X-Hub-Signature'];
    const payload = event.body;

    const expectedSignature = `sha1=${crypto.createHmac('sha1', githubWebhookSecret).update(payload).digest('hex')}`;

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      callback(null, generatePolicy('user', 'Allow', event.methodArn));
    } else {
      callback('Unauthorized', null);
    }
};