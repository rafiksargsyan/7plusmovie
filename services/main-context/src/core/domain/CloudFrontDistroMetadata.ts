import { v4 as uuid } from 'uuid';

export class CloudFrontDistroMetadata {
  public readonly id: string;
  private creationTime: number;
  private lastUpdateTime: number;
  private domain: string; // TODO: create value object
  private arn: string;// TODO: create value object
  private assumeRoleArnForMainAccount: string;  // TODO: create value object
  private awsAccountNumber: string; // TODO: create value object
  private signerKeyId: string; // TODO: create value object
  private usageInBytesForTheMonth: number;

  public constructor(createEmptyObject: boolean, domain?: string | undefined, arn?: string | undefined,
    assumeRoleArnForMainAccount?: string | undefined, awsAccountNumber?: string | undefined,
    signerKeyId?: string | undefined) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.domain = this.validateDomain(domain);
      this.arn = this.validateArn(arn);
      this.assumeRoleArnForMainAccount = this.validateAssumeRoleArn(assumeRoleArnForMainAccount);
      this.awsAccountNumber = this.validateAwsAccountNumber(awsAccountNumber);
      this.signerKeyId = this.validateSignerKeyId(signerKeyId);
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
    }
  }

  public setUsageInBytesForTheMonth(usage: number | undefined) {
    if (usage == undefined || usage < 0) {
      throw new InvalidUsageError();
    }
    this.usageInBytesForTheMonth = usage;
    this.lastUpdateTime = Date.now();
  }

  private validateDomain(domain: string | undefined) {
    if (domain === undefined || ! /\S/.test(domain)) {
      throw new InvalidCloudFrontDomainError();
    }
    return domain;
  }

  private validateArn(arn: string | undefined) {
    if (arn === undefined || ! /\S/.test(arn)) {
        throw new InvalidCloudFrontDistroArnError();
      }
      return arn;
  }

  private validateAssumeRoleArn(arn: string | undefined) {
    if (arn === undefined || ! /\S/.test(arn)) {
        throw new InvalidAssumeRoleArnError();
      }
      return arn;
  }

  private validateAwsAccountNumber(awsAccountNumber: string | undefined) {
    if (awsAccountNumber === undefined || ! /\S/.test(awsAccountNumber)) {
        throw new InvalidAwsAccountNumberError();
      }
      return awsAccountNumber;
  }

  private validateSignerKeyId(signerKeyId: string | undefined) {
    if (signerKeyId === undefined || ! /\S/.test(signerKeyId)) {
        throw new InvalidSignerKeyIdError();
      }
      return signerKeyId;
  }
}

class InvalidCloudFrontDomainError extends Error {}

class InvalidCloudFrontDistroArnError extends Error {}

class InvalidAssumeRoleArnError extends Error {}

class InvalidAwsAccountNumberError extends Error {}

class InvalidSignerKeyIdError extends Error {}

class InvalidUsageError extends Error {}
