import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { Octokit } from '@octokit/rest';
import { AudioLangCode } from '../domain/AudioLangCodes';
import { SubsLangCode } from '../domain/SubsLangCodes';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const marshaller = new Marshaller();

interface AudioTranscodeSpec {
  stream: number;
  bitrate: string;
  channels: number;
  lang: AudioLangCode;
}
  
interface TextTranscodeSpec {
  stream: number;
  forced: boolean;
  lang: SubsLangCode;
}

interface TranscodingJobRead {
  id: string;
  mkvS3ObjectKey: string;
  outputFolderKey: string;
  audioTranscodeSpecs: AudioTranscodeSpec[];
  textTranscodeSpecs: TextTranscodeSpec[];
  defaultAudioTrack: number | undefined;
  defaultTextTrack: number | undefined;
  githubWorkflowRunId: number | undefined;
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
          "audio" : (transcodingJobRead as TranscodingJobRead).audioTranscodeSpecs.map(_ => { return {..._, lang: _.lang.code }}),
          "text" : (transcodingJobRead as TranscodingJobRead).textTranscodeSpecs.map(_ => { return {..._, lang: _.lang.code }}),
          "defaultAudioTrack" : (transcodingJobRead as TranscodingJobRead).defaultAudioTrack,
          "defaultTextTrack"  : (transcodingJobRead as TranscodingJobRead).defaultTextTrack
        }
        const workflowInputParams = {
          mkv_s3_object_key: (transcodingJobRead as TranscodingJobRead).mkvS3ObjectKey,
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
