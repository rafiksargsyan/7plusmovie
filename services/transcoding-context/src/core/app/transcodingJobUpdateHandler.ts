import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { TranscodingJob } from '../domain/TranscodingJob';

const marshaller = new Marshaller();

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  for (const record of event.Records) {
    if (record.eventName === 'REMOVE') {
      // For now nothing to do in case of item removal
    } else {
      let movieTranscodingJob = new TranscodingJob(true);
      Object.assign(movieTranscodingJob, marshaller.unmarshallItem(record.dynamodb?.NewImage!));
      console.log(JSON.stringify(movieTranscodingJob));
      // Run github action
    }
  }
}
