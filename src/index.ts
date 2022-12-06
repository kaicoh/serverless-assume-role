import AWS from 'aws-sdk'
import _get from 'lodash.get'

export interface Serverless {
  getProvider: (name: string) => AwsProvider

  service: {
    custom: {
      [key: string]: any
    }

    provider: {
      deploymentBucketObject?: {
        serverSideEncryption?: string
      }
    }
  }

  classes: {
    Error: ErrorConstructor
  }
}

export interface Options {
  stage: string | null
  region: string | null
}

export interface Utils {
  log: {
    info: (...args: any[]) => void
  }
}

export interface AwsProvider {
  getCredentials: () => Credentials
  cachedCredentials?: Credentials
  request: <T>(service: string, method: string, params: {}) => Promise<T>
}

export interface Credentials {
  credentials: AWS.Credentials
  signatureVersion?: string
}

export default class ServerlessAssumeRole {
  serverless: Serverless
  options: Options
  log: Utils['log']
  params: AWS.STS.Types.AssumeRoleRequest

  hooks: {
    [event: string]: Function
  }

  commands: {
    [command: string]: {
      usage: string
      lifecycleEvents: string[]
      options?: {
        [name: string]: {
          usage?: string
          required?: boolean
          shortcut?: string
          default?: string | boolean
          type: 'string' | 'boolean' | 'multiple'
        }
      }
    }
  }

  constructor (
    serverless: Serverless,
    options: Options,
    utils: Utils
  ) {
    this.serverless = serverless
    this.options = options
    this.log = utils.log
    this.params = this.getAssumeRoleParams()

    this.commands = {
      'assumerole:test': {
        usage: 'Test assume role command under the current configuration in serverless.yml',
        lifecycleEvents: ['run']
      }
    }

    this.hooks = {
      'assumerole:test:run': this.run.bind(this),
      initialize: this.run.bind(this)
    }
  }

  get provider (): AwsProvider {
    return this.serverless.getProvider('aws')
  }

  private getAssumeRoleParams (): AWS.STS.Types.AssumeRoleRequest {
    const {
      durationSeconds,
      externalId,
      policy,
      policyArns,
      roleArn,
      roleSessionName,
      serialNumber,
      sourceIdentity,
      tags,
      tokenCode,
      transitiveTagKeys
    } = this.serverless.service.custom?.assumeRole ?? {}

    const intDurationSeconds = Number.parseInt(durationSeconds, 10)
    if (durationSeconds !== undefined && Number.isNaN(intDurationSeconds)) {
      throw this.error('durationSeconds should be an integer')
    }

    if (externalId !== undefined && typeof externalId !== 'string') {
      throw this.error('externalId should be a string')
    }

    if (policy !== undefined && typeof policy !== 'string') {
      throw this.error('policy should be a string')
    }

    if (
      policyArns !== undefined &&
      !(Array.isArray(policyArns) && policyArns.every(isPolicyDescriptorType))
    ) {
      throw this.error('policyArns should be an array of object having "arn" field')
    }

    if (roleArn !== undefined && typeof roleArn !== 'string') {
      throw this.error('roleArn should be a string')
    }

    if (roleSessionName !== undefined && typeof roleSessionName !== 'string') {
      throw this.error('roleSessionName should be a string')
    }

    if (serialNumber !== undefined && typeof serialNumber !== 'string') {
      throw this.error('serialNumber should be a string')
    }

    if (sourceIdentity !== undefined && typeof sourceIdentity !== 'string') {
      throw this.error('sourceIdentity should be a string')
    }

    if (
      tags !== undefined &&
      !(Array.isArray(tags) && tags.every(isValidTag))
    ) {
      throw this.error('tags should be an array of object having "key" and "value" field')
    }

    if (tokenCode !== undefined && typeof tokenCode !== 'string') {
      throw this.error('tokenCode should be a string')
    }

    if (
      transitiveTagKeys !== undefined &&
      !(
        Array.isArray(transitiveTagKeys) &&
        transitiveTagKeys.every((val) => typeof val === 'string')
      )
    ) {
      throw this.error('transitiveTagKeys should be an array of string')
    }

    return {
      DurationSeconds: durationSeconds === undefined
        ? undefined
        : intDurationSeconds,
      ExternalId: externalId,
      Policy: policy,
      PolicyArns: policyArns,
      RoleArn: roleArn,
      RoleSessionName: roleSessionName,
      SerialNumber: serialNumber,
      SourceIdentity: sourceIdentity,
      Tags: tags === undefined ? undefined : toTags(tags),
      TokenCode: tokenCode,
      TransitiveTagKeys: transitiveTagKeys
    }
  }

  async run (): Promise<void> {
    const aws = this.provider
    /*
     * Execute assume role
     */
    const response = await aws.request<AWS.STS.Types.AssumeRoleResponse>(
      'STS',
      'assumeRole',
      this.params
    )

    const { Credentials } = response
    if (Credentials === undefined) {
      throw new Error('Failed to get credentials from assume role request')
    }

    this.log.info('AssumeRole action succeeded')

    /*
     * Create new credentials
     */
    const { AccessKeyId, SecretAccessKey, SessionToken } = Credentials

    const prefix = 'SLS_ASSUME_ROLE'
    process.env[`${prefix}_ACCESS_KEY_ID`] = AccessKeyId
    process.env[`${prefix}_SECRET_ACCESS_KEY`] = SecretAccessKey
    process.env[`${prefix}_SESSION_TOKEN`] = SessionToken

    const credentials: Credentials = {
      credentials: new AWS.EnvironmentCredentials(prefix)
    }

    // See: https://github.com/serverless/serverless/blob/main/lib/plugins/aws/provider.js#L1682-L1689
    if (_get(this.serverless, ['service', 'provider', 'deploymentBucketObject', 'serverSideEncryption']) === 'aws:kms') {
      credentials.signatureVersion = 'v4'
    }

    /*
     * Overwrite provider's credentials
     */
    aws.cachedCredentials = credentials
  }

  error (message?: string): Error {
    return new this.serverless.classes.Error(message)
  }
}

function isPolicyDescriptorType (obj: any): obj is { arn: string } {
  if (typeof obj !== 'object') {
    return false
  }
  return typeof obj.arn === 'string'
}

function isValidTag (obj: any): boolean {
  if (typeof obj !== 'object') {
    return false
  }
  return typeof obj.key === 'string' && typeof obj.value === 'string'
}

function toTags (tags: any[]): Array<{ Key: string, Value: string }> {
  return tags.map(({ key, value }) => ({ Key: key, Value: value }))
}

module.exports = ServerlessAssumeRole
