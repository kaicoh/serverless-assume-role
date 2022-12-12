import AWS from 'aws-sdk'
import ServerlessAssumeRole, {
  Serverless,
  Options,
  Utils
} from '..'

jest.mock('aws-sdk')

describe('ServerlessAssumeRole', () => {
  const options: Options = { stage: 'dev', region: 'local' }
  const utils: Utils = {
    log: { notice: jest.fn() }
  }

  describe('validation for configuration', () => {
    function mockServerless (params: any): Serverless {
      const sls: any = {
        getProvider: jest.fn(() => ({})),
        setProvider: jest.fn(),
        service: {
          custom: {
            assumeRole: { params }
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
  })

  describe('intercepting "request" method of aws provider', () => {
    const STSMock: any = AWS.STS
    const output = { foo: 'bar' }

    let mockAssumeRole: any
    let mockAwsProvider: any

    function mockServerless (params: any, provider?: {}): Serverless {
      const sls: any = {
        getProvider: jest.fn(() => mockAwsProvider),
        setProvider: (_: string, proxy: any) => { mockAwsProvider = proxy },
        service: {
          custom: {
            assumeRole: { params }
          },
          provider
        },
        classes: { Error }
      }
      return sls
    }

    function init (config: any, provider?: {}): ServerlessAssumeRole {
      const serverless = mockServerless(config, provider)
      return new ServerlessAssumeRole(serverless, options, utils)
    }

    beforeEach(() => {
      mockAwsProvider = {
        getCredentials: () => ({}),
        request: jest.fn(async () => await Promise.resolve(output))
      }

      mockAssumeRole = jest.fn(() => ({
        promise: jest.fn(async () => await Promise.resolve({
          Credentials: {
            AccessKeyId: 'access key id',
            SecretAccessKey: 'secret access key',
            SessionToken: 'session token',
            Expiration: new Date()
          }
        }))
      }))

      STSMock.mockImplementation(() => ({
        assumeRole: mockAssumeRole
      }))
    })

    it('calls AssumeRole when plugin\'s provider calls any "request"', async () => {
      const plugin = init({})
      await plugin.provider.request('foo', 'bar', {})
      expect(mockAssumeRole).toHaveBeenCalled()
    })

    it('calls AssumeRole only once even if plugin\'s provider calls "request" more than once', async () => {
      const plugin = init({})
      await plugin.provider.request('foo', 'bar', {})
      await plugin.provider.request('foo', 'bar', {})
      expect(mockAssumeRole).toHaveBeenCalledTimes(1)
    })

    it('gets original outputs even if the aws provider is a proxy', async () => {
      const plugin = init({})
      const result = await plugin.provider.request('foo', 'bar', {})
      expect(result).toEqual(output)
    })

    it('calls AssumeRole with empty object if there is no "custom" configuration in serverless.yml', async () => {
      const sls: any = {
        getProvider: jest.fn(() => mockAwsProvider),
        setProvider: (_: string, proxy: any) => { mockAwsProvider = proxy },
        service: {
          provider: {}
        },
        classes: { Error }
      }
      const plugin = new ServerlessAssumeRole(sls, options, utils)
      await plugin.provider.request('foo', 'bar', {})
      expect(mockAssumeRole).toHaveBeenCalledWith({})
    })

    const assumeRoleParamsTable: Array<[string, string, any]> = [
      ['DurationSeconds', 'durationSeconds', 123],
      ['Policy', 'policy', 'foobar'],
      ['PolicyArns', 'policyArns', [{ arn: 'foovar' }]],
      ['RoleArn', 'roleArn', 'foobar'],
      ['RoleSessionName', 'roleSessionName', 'foobar'],
      ['SerialNumber', 'serialNumber', 'foobar'],
      ['SourceIdentity', 'sourceIdentity', 'foobar'],
      ['TokenCode', 'tokenCode', 'foobar'],
      ['TransitiveTagKeys', 'transitiveTagKeys', ['foo', 'bar']]
    ]

    it.each(assumeRoleParamsTable)('calls AssumeRole with "%s" from serverless configuration', async (prop, key, value) => {
      const plugin = init({ [key]: value })
      await plugin.provider.request('foo', 'bar', {})
      expect(mockAssumeRole).toHaveBeenCalledWith(expect.objectContaining({
        [prop]: value
      }))
    })

    it('calls AssumeRole with "Tags" from serverless configuration', async () => {
      const plugin = init({ tags: [{ key: 'foo', value: 'bar' }] })
      await plugin.provider.request('foo', 'bar', {})
      expect(mockAssumeRole).toHaveBeenCalledWith(expect.objectContaining({
        Tags: [{ Key: 'foo', Value: 'bar' }]
      }))
    })

    it('calls AssumeRole with "DurationSeconds" as integer if it is given as string', async () => {
      const plugin = init({ durationSeconds: '456' })
      await plugin.provider.request('foo', 'bar', {})
      expect(mockAssumeRole).toHaveBeenCalledWith(expect.objectContaining({
        DurationSeconds: 456
      }))
    })

    it('sets AWS environment variables for getting assumed role credentials', async () => {
      const plugin = init({})
      await plugin.provider.request('foo', 'bar', {})
      expect(process.env.SLS_ASSUME_ROLE_ACCESS_KEY_ID).toEqual('access key id')
      expect(process.env.SLS_ASSUME_ROLE_SECRET_ACCESS_KEY).toEqual('secret access key')
      expect(process.env.SLS_ASSUME_ROLE_SESSION_TOKEN).toEqual('session token')
    })

    it('sets new AWS.EnvironmentCredentials as provider\'s cache', async () => {
      const plugin = init({})
      await plugin.provider.request('foo', 'bar', {})
      expect(plugin.provider.cachedCredentials).toBeDefined()
      expect(plugin.provider.cachedCredentials?.credentials).toBeInstanceOf(AWS.EnvironmentCredentials)
    })

    it('throws an error when failed to get credentials from AssumeRole request', async () => {
      mockAssumeRole = jest.fn(() => ({
        promise: jest.fn(async () => await Promise.resolve({}))
      }))
      const plugin = init({})
      await expect(async () => await plugin.provider.request('foo', 'bar', {}))
        .rejects.toThrow(/Failed to get credentials from assume role request/)
    })

    it('sets signatureVersion to new credentials if the deployment bucket has kms key', async () => {
      const plugin = init({}, { deploymentBucketObject: { serverSideEncryption: 'aws:kms' } })
      await plugin.provider.request('foo', 'bar', {})
      expect(plugin.provider.cachedCredentials).toBeDefined()
      expect(plugin.provider.cachedCredentials?.signatureVersion).toEqual('v4')
    })
  })
})
