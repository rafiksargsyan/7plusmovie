import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { TranscodingJob } from '../domain/TranscodingJob';
import { Octokit } from '@octokit/rest';
import { AudioLangCode } from '../domain/AudioLangCodes';
import { SubsLangCode } from '../domain/SubsLangCodes';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const marshallOptions = {
  convertClassInstanceToMap: true
};
  
const translateConfig = { marshallOptions };
  
const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
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
        let transcodingJob = new TranscodingJob(true);
        Object.assign(transcodingJob, transcodingJobItem);
        const transcodingSpec = {
          "audio" : (transcodingJobRead as TranscodingJobRead).audioTranscodeSpecs.map(_ => { return {..._, lang: _.lang.code }}),
          "text" : (transcodingJobRead as TranscodingJobRead).textTranscodeSpecs.map(_ => { return {..._, lang: _.lang.code }}),
          "defaultAudioTrack" : (transcodingJobRead as TranscodingJobRead).defaultAudioTrack,
          "defaultTextTrack"  : (transcodingJobRead as TranscodingJobRead).defaultTextTrack
        }
        const workflowInputParams = {
          mkvFilePath: (transcodingJobRead as TranscodingJobRead).mkvS3ObjectKey,
          outputFolder: (transcodingJobRead as TranscodingJobRead).outputFolderKey,
          transcodingSpecBase64Encoded: Buffer.from(JSON.stringify(transcodingSpec)).toString("base64")
        };
        const params = {
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          // Filename is also accepted as an id
          workflow_id: process.env.TRANSCODING_WORKFLOW_FILE_NAME!,
          ref: process.env.GIT_REF!,
          inputs: workflowInputParams
        }
        const response = await octokit.actions.createWorkflowDispatch(params);
        transcodingJob.setGithubWorkflowRunId((response.data as any).id);
        await docClient.put({TableName: process.env.DYNAMODB_TRANSCODING_JOB_TABLE_NAME, Item: transcodingJob});
      }
    }
  } catch (e) {
    console.error(e);
  }
}
