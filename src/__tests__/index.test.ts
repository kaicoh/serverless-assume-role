import AWS from 'aws-sdk'
import ServerlessAssumeRole, {
  Serverless,
  Options,
  Utils,
  AwsProvider
} from '..'

jest.mock('aws-sdk')

describe('ServerlessAssumeRole', () => {
  const options: Options = { stage: 'dev', region: 'local' }
  const utils: Utils = {
    log: { info: jest.fn() }
  }

  describe('constructor', () => {
    function mockServerless (config: any): Serverless {
      const sls: any = {
        service: {
          custom: {
            assumeRole: config
          }
        },
        classes: { Error }
      }
      return sls
    }

    function subject (config: any): ServerlessAssumeRole {
      const serverless = mockServerless(config)
      return new ServerlessAssumeRole(serverless, options, utils)
    }

    it('sets an empty object to assume role inputs if there is no "custom" configuration', () => {
      const sls: any = {
        service: {},
        classes: { Error }
      }
      const plugin = new ServerlessAssumeRole(sls, options, utils)
      expect(plugin.params).toEqual({})
    })

    it('sets "DurationSeconds" to assume role inputs from "custom" configuration', () => {
      const pluginStr = subject({ durationSeconds: '123' })
      expect(pluginStr.params.DurationSeconds).toEqual(123)

      const pluginNum = subject({ durationSeconds: 456 })
      expect(pluginNum.params.DurationSeconds).toEqual(456)
    })

    it('sets undefined as "DurationSeconds" to assume role inputs if "custom" configuration isn\'t set', () => {
      const plugin = subject({})
      expect(plugin.params.DurationSeconds).toBeUndefined()
    })

    it('sets "ExternalId" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ externalId: 'foobar' })
      expect(plugin.params.ExternalId).toEqual('foobar')
    })

    it('sets "Policy" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ policy: 'foobar' })
      expect(plugin.params.Policy).toEqual('foobar')
    })

    it('sets "PolicyArns" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ policyArns: [{ arn: 'foobar' }] })
      expect(plugin.params.PolicyArns).toEqual([{ arn: 'foobar' }])
    })

    it('sets "RoleArn" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ roleArn: 'foobar' })
      expect(plugin.params.RoleArn).toEqual('foobar')
    })

    it('sets "RoleSessionName" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ roleSessionName: 'foobar' })
      expect(plugin.params.RoleSessionName).toEqual('foobar')
    })

    it('sets "SerialNumber" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ serialNumber: 'foobar' })
      expect(plugin.params.SerialNumber).toEqual('foobar')
    })

    it('sets "SourceIdentity" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ sourceIdentity: 'foobar' })
      expect(plugin.params.SourceIdentity).toEqual('foobar')
    })

    it('sets "Tags" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ tags: [{ key: 'foo', value: 'bar' }] })
      expect(plugin.params.Tags).toEqual([{ Key: 'foo', Value: 'bar' }])
    })

    it('sets "TokenCode" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ tokenCode: 'foobar' })
      expect(plugin.params.TokenCode).toEqual('foobar')
    })

    it('sets "TransitiveTagKeys" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ transitiveTagKeys: ['foo', 'bar'] })
      expect(plugin.params.TransitiveTagKeys).toEqual(['foo', 'bar'])
    })

    it('throws an error if "durationSeconds" is neither undefined nor an interger', () => {
      const error = /durationSeconds should be an integer/

      expect(subject({ durationSeconds: undefined }))
        .toBeInstanceOf(ServerlessAssumeRole)
      expect(subject({ durationSeconds: 123 }))
        .toBeInstanceOf(ServerlessAssumeRole)

      expect(() => subject({ durationSeconds: 'foo' })).toThrow(error)
      expect(() => subject({ durationSeconds: ['foo', 'bar'] })).toThrow(error)
      expect(() => subject({ durationSeconds: {} })).toThrow(error)
    })

    const stringFields = [
      'externalId',
      'policy',
      'roleArn',
      'roleSessionName',
      'serialNumber',
      'sourceIdentity',
      'tokenCode'
    ]

    it.each(stringFields)('throws an error if "%s" is neither undefined nor a string', (field) => {
      const error = new RegExp(`${field} should be a string`)

      expect(subject({ [field]: undefined }))
        .toBeInstanceOf(ServerlessAssumeRole)
      expect(subject({ [field]: 'foo' }))
        .toBeInstanceOf(ServerlessAssumeRole)

      expect(() => subject({ [field]: 123 })).toThrow(error)
      expect(() => subject({ [field]: ['foo', 'bar'] })).toThrow(error)
      expect(() => subject({ [field]: {} })).toThrow(error)
    })

    it('throws an error if "policyArns" is neither undefined nor an array of object having arn field', () => {
      /*
       * PolicyDectatorType
       * See: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sts/interfaces/policydescriptortype.html
       */
      const error = /policyArns should be an array of object having "arn" field/

      expect(subject({ policyArns: undefined }))
        .toBeInstanceOf(ServerlessAssumeRole)
      expect(subject({ policyArns: [{ arn: 'bar' }, { arn: 'foobar' }] }))
        .toBeInstanceOf(ServerlessAssumeRole)

      expect(() => subject({ policyArns: 123 })).toThrow(error)
      expect(() => subject({ policyArns: 'foobar' })).toThrow(error)
      expect(() => subject({ policyArns: ['foo', 'bar'] })).toThrow(error)
      expect(() => subject({ policyArns: [{ arn: 123 }] })).toThrow(error)
      expect(() => subject({ policyArns: [{}, { arn: 'foo' }] })).toThrow(error)
      expect(() => subject({ policyArns: {} })).toThrow(error)
    })

    it('throws an error if "tags" is neither undefined nor an array of object having key and value field', () => {
      const error = /tags should be an array of object having "key" and "value" field/

      expect(subject({ tags: undefined }))
        .toBeInstanceOf(ServerlessAssumeRole)
      expect(subject({
        tags: [{ key: 'bar', value: 'foo' }, { key: 'foo', value: 'bar' }]
      })).toBeInstanceOf(ServerlessAssumeRole)

      expect(() => subject({ tags: 123 })).toThrow(error)
      expect(() => subject({ tags: 'foobar' })).toThrow(error)
      expect(() => subject({ tags: ['foo', 'bar'] })).toThrow(error)
      expect(() => subject({ tags: [{ key: 123, value: 'foo' }] })).toThrow(error)
      expect(() => subject({
        tags: [{ key: 'foo' }, { key: 'foo', value: 'bar' }]
      })).toThrow(error)
      expect(() => subject({ tags: {} })).toThrow(error)
    })

    it('throws an error if "transitiveTagKeys" is neither undefined nor an array of string', () => {
      const error = /transitiveTagKeys should be an array of string/

      expect(subject({ transitiveTagKeys: undefined }))
        .toBeInstanceOf(ServerlessAssumeRole)
      expect(subject({
        transitiveTagKeys: ['foo', 'bar']
      })).toBeInstanceOf(ServerlessAssumeRole)

      expect(() => subject({ transitiveTagKeys: 123 })).toThrow(error)
      expect(() => subject({ transitiveTagKeys: 'foobar' })).toThrow(error)
      expect(() => subject({ transitiveTagKeys: [123, 'foo'] })).toThrow(error)
      expect(() => subject({ transitiveTagKeys: {} })).toThrow(error)
    })

    it('sets hook to "initialize" event', () => {
      const plugin = subject({})
      expect(plugin.hooks.initialize).toBeDefined()
    })
  })

  describe('run', () => {
    let mock: ReturnType<typeof jest.spyOn>
    let aws: AwsProvider

    const credentials: any = {}

    async function subject (_aws: AwsProvider, provider: any = {}): Promise<void> {
      const sls: any = {
        getProvider: jest.fn(() => _aws),
        service: {
          custom: {
            assumeRole: {
              externalId: 'my-external-id',
              roleArn: 'my-role-arn'
            }
          },
          provider
        },
        classes: { Error }
      }

      const options: Options = { stage: 'dev', region: 'local' }

      const plugin = new ServerlessAssumeRole(sls, options, utils)
      await plugin.run()
    }

    beforeEach(() => {
      mock = jest.spyOn(AWS, 'EnvironmentCredentials')
    })

    afterEach(() => {
      mock.mockRestore()
    })

    it('calls STS assume role request with current aws provider', async () => {
      aws = {
        getCredentials: () => ({ credentials }),
        request: jest.fn(async () => await Promise.resolve({ Credentials: {} }) as any)
      }

      await subject(aws)

      expect(aws.request).toHaveBeenCalledWith('STS', 'assumeRole', {
        ExternalId: 'my-external-id',
        RoleArn: 'my-role-arn'
      })
    })

    it('creates new credentials using STS assume role response', async () => {
      aws = {
        getCredentials: () => ({ credentials }),
        request: jest.fn(async () => await Promise.resolve({
          Credentials: {
            AccessKeyId: 'access key id',
            SecretAccessKey: 'secret access key',
            SessionToken: 'session token'
          }
        }) as any)
      }

      await subject(aws)

      expect(process.env.SLS_ASSUME_ROLE_ACCESS_KEY_ID).toEqual('access key id')
      expect(process.env.SLS_ASSUME_ROLE_SECRET_ACCESS_KEY).toEqual('secret access key')
      expect(process.env.SLS_ASSUME_ROLE_SESSION_TOKEN).toEqual('session token')
      expect(AWS.EnvironmentCredentials).toHaveBeenCalledWith('SLS_ASSUME_ROLE')
    })

    it('throws an error if assume role response doesn\'t have credentials', async () => {
      aws = {
        getCredentials: () => ({ credentials }),
        request: jest.fn(async () => await Promise.resolve({}) as any)
      }

      await expect(async () => await subject(aws)).rejects.toThrow(/Failed to get credentials from assume role request/)
    })

    it('sets signature version "v4" to new credentials if deployment bucket using kms encryption', async () => {
      aws = {
        getCredentials: () => ({ credentials }),
        request: jest.fn(async () => await Promise.resolve({ Credentials: {} }) as any)
      }

      await subject(aws, { deploymentBucketObject: { serverSideEncryption: 'aws:kms' } })

      expect(aws.cachedCredentials).toEqual(expect.objectContaining({
        signatureVersion: 'v4'
      }))
    })

    it('overwrites provider\'s cached credentials', async () => {
      aws = {
        getCredentials: () => ({ credentials }),
        request: jest.fn(async () => await Promise.resolve({ Credentials: {} }) as any)
      }

      await subject(aws)

      expect(aws.cachedCredentials).toBeDefined()
      expect(aws.cachedCredentials?.credentials).toBeInstanceOf(AWS.EnvironmentCredentials)
    })
  })
})
