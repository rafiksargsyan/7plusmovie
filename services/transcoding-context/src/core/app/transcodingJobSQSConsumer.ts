import { Octokit } from '@octokit/rest';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { SQS } from '@aws-sdk/client-sqs';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const transcodingJobQueueUrl = process.env.TRANSCODING_JOB_QUEUE_URL!;
const githubOwner = process.env.GITHUB_OWNER!;
const githubRepo = process.env.GITHUB_REPO!;

const secretsManager = new SecretsManager({});
const sqs = new SQS();

export const handler = async (): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const octokit = new Octokit({
    auth: secret.GITHUB_PAT!,
  });
  
  const availableRunners = await getAvailableRunners(octokit);

  if (availableRunners === 0) return;
 
  const sqsParams = {
    QueueUrl: transcodingJobQueueUrl,
    MaxNumberOfMessages: Math.min(availableRunners, 10),
  };

  const data = await sqs.receiveMessage(sqsParams);

  if (!data.Messages) {
    return;
  }

  for (const message of data.Messages) {
    const jobDetails = JSON.parse(message.Body!);
    await octokit.actions.createWorkflowDispatch(jobDetails);

    await sqs.deleteMessage({
      QueueUrl: transcodingJobQueueUrl,
      ReceiptHandle: message.ReceiptHandle!,
    });
  }
 
}

async function getAvailableRunners(octokit: Octokit): Promise<number> {
  const response = await octokit.actions.listSelfHostedRunnersForRepo({
    owner: githubOwner,
    repo: githubRepo,
  });
  
  return response.data.runners.filter(runner => runner.status === 'online' && !runner.busy).length;
}