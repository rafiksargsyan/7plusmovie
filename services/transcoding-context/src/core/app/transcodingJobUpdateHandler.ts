import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { Octokit } from '@octokit/rest';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { Lang } from '../domain/Lang';
import { Nullable } from '../domain/Nullable';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const marshaller = new Marshaller();

interface AudioTranscodeSpec {
  stream: number;
  bitrate: string;
  channels: number;
  lang: Lang;
  fileName: string;
  name: string;
}

interface TextTranscodeSpec {
  stream: number;
  name: string;
  fileName: string;
  lang: Lang;
}

interface VideoTranscodeSpec {
  resolutions: { fileName: string, resolution: number } []; // 360, 480, 720, 1080, etc.
  stream: number;
}

interface TranscodingJobRead {
  id: string;
  mkvS3ObjectKey: string;
  mkvHttpUrl: string;
  outputFolderKey: string;
  audioTranscodeSpecs: AudioTranscodeSpec[];
  textTranscodeSpecs: TextTranscodeSpec[];
  videoTranscodeSpec: VideoTranscodeSpec;
  githubWorkflowRunId: Nullable<number>;
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  try {  
    const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
    const secret = JSON.parse(secretStr.SecretString!);
    const octokit = new Octokit({
      auth: secret.GITHUB_PAT!,
    });
    for (const record of event.Records) {
      if (record.eventName === 'REMOVE') {
        // For now nothing to do in case of item removal
      } else {
        const transcodingJobItem = marshaller.unmarshallItem(record.dynamodb?.NewImage!);
        let transcodingJobRead = {};
        Object.assign(transcodingJobRead, transcodingJobItem);
        if ((transcodingJobRead as TranscodingJobRead).githubWorkflowRunId !== undefined) {
          return;
        }
        const transcodingSpec = {
          "audio" : (transcodingJobRead as TranscodingJobRead).audioTranscodeSpecs.map(_ => ({..._, lang: _.lang.key })),
          "text" : (transcodingJobRead as TranscodingJobRead).textTranscodeSpecs.map(_ => ({..._, lang: _.lang.key })),
          "video" : (transcodingJobRead as TranscodingJobRead).videoTranscodeSpec
        }
        const workflowInputParams = {
          mkv_s3_object_key: (transcodingJobRead as TranscodingJobRead).mkvS3ObjectKey,
          mkv_http_url: (transcodingJobRead as TranscodingJobRead).mkvHttpUrl,
          output_s3_folder_key: (transcodingJobRead as TranscodingJobRead).outputFolderKey,
          transcoding_spec_base64_encoded: Buffer.from(JSON.stringify(transcodingSpec)).toString("base64"),
          transcoding_context_job_id: (transcodingJobRead as TranscodingJobRead).id
        };
        const params = {
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          // Filename is also accepted as an id
          workflow_id: process.env.TRANSCODING_WORKFLOW_FILE_NAME!,
          ref: process.env.GIT_REF!,
          inputs: workflowInputParams
        }
        await octokit.actions.createWorkflowDispatch(params);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
