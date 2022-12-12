import AWS from 'aws-sdk'
import _get from 'lodash.get'

export interface Serverless {
  getProvider: (name: string) => AwsProvider
  setProvider: (name: string, provider: AwsProvider) => void

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
    notice: (...args: any[]) => void
  }
}

export interface AwsProvider {
  stage?: string
  getCredentials: () => Credentials
  cachedCredentials?: Credentials
  request: <T>(service: string, method: string, params: {}, options?: {}) => Promise<T>
}

export interface Credentials {
  credentials: AWS.Credentials
  signatureVersion?: string
}

export default class ServerlessAssumeRole {
  serverless: Serverless
  options: Options
  log: Utils['log']

  constructor (
    serverless: Serverless,
    options: Options,
    utils: Utils
  ) {
    this.serverless = serverless
    this.options = options
    this.log = utils.log

    if (this.shouldRun()) {
      let assumed = false

      const inputs = this.getAssumeRoleParams()

      const proxyAws = new Proxy(this.provider, {
        get (target, prop) {
          if (prop === 'request') {
            return new Proxy(target[prop], {
              apply: async (target, thisArg, argumentsList) => {
                if (!assumed) {
                  const { credentials: cred } = thisArg.getCredentials()
                  /*
                   * Execute assume role
                   */
                  const sts = new AWS.STS({ credentials: cred })
                  const { Credentials } = await sts.assumeRole(inputs).promise()

                  if (Credentials === undefined) {
                    throw new Error('Failed to get credentials from assume role request')
                  }
                  /*
                   * Create new credentials
                   */
                  const {
                    AccessKeyId,
                    SecretAccessKey,
                    SessionToken,
                    Expiration
                  } = Credentials

                  const prefix = 'SLS_ASSUME_ROLE'
                  process.env[`${prefix}_ACCESS_KEY_ID`] = AccessKeyId
                  process.env[`${prefix}_SECRET_ACCESS_KEY`] = SecretAccessKey
                  process.env[`${prefix}_SESSION_TOKEN`] = SessionToken

                  const credentials: Credentials = {
                    credentials: new AWS.EnvironmentCredentials(prefix)
                  }

                  // See: https://github.com/serverless/serverless/blob/main/lib/plugins/aws/provider.js#L1682-L1689
                  if (_get(serverless, ['service', 'provider', 'deploymentBucketObject', 'serverSideEncryption']) === 'aws:kms') {
                    credentials.signatureVersion = 'v4'
                  }

                  /*
                   * Overwrite provider's credentials
                   */
                  thisArg.cachedCredentials = credentials

                  utils.log.notice(`Assume role succeeded! The new credentials is valid until ${Expiration.toLocaleString()}`)

                  assumed = true
                }

                return Reflect.apply(target, thisArg, argumentsList)
              }
            })
          }

          return Reflect.get(target, prop)
        }
      })

      this.serverless.setProvider('aws', proxyAws)
    }
  }

  get provider (): AwsProvider {
    return this.serverless.getProvider('aws')
  }

  private shouldRun (): boolean {
    const stage = this.options.stage ?? this.provider.stage ?? 'dev'
    return this.stagesToRun().includes(stage)
  }

  private stagesToRun (): string[] {
    const { stages } = this.serverless.service.custom?.assumeRole ?? {}
    if (stages === undefined) {
      return []
    }

    if (Array.isArray(stages) && stages.every((stage) => typeof stage === 'string')) {
      return stages
    }

    throw this.error('stages should be an array of string')
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
    } = _get(this.serverless, ['service', 'custom', 'assumeRole', 'params'], {})

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
