import * as Serverless from 'serverless'
import ServerlessAssumeRole from '..'
import { AssumeRoleInputs, ServerlessV3, ServerlessUtils } from '../types'

describe('ServerlessAssumeRole', () => {
  let utils: ServerlessUtils

  function mockServerless (config: AssumeRoleInputs): ServerlessV3 {
    const sls: any = {
      getProvider: jest.fn(() => ({
        getCredentials: jest.fn(() => ({}))
      })),
      service: {
        custom: {
          assumeRole: config
        }
      },
      classes: { Error }
    }
    return sls
  }

  beforeEach(() => {
    utils = {
      log: {
        error: jest.fn(),
        warning: jest.fn(),
        notice: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        success: jest.fn(),
        verbose: jest.fn()
      }
    }
  })

  describe('constructor', () => {
    function subject (config: any): ServerlessAssumeRole {
      const serverless = mockServerless(config)
      const options: Serverless.Options = { stage: 'dev', region: 'local' }
      return new ServerlessAssumeRole(serverless, options, utils)
    }

    it('sets "DurationSeconds" to assume role inputs from "custom" configuration', () => {
      const pluginStr = subject({ durationSeconds: '123' })
      expect(pluginStr.input.DurationSeconds).toEqual(123)

      const pluginNum = subject({ durationSeconds: 456 })
      expect(pluginNum.input.DurationSeconds).toEqual(456)
    })

    it('sets undefined as "DurationSeconds" to assume role inputs if "custom" configuration isn\'t set', () => {
      const plugin = subject({})
      expect(plugin.input.DurationSeconds).toBeUndefined()
    })

    it('sets "ExternalId" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ externalId: 'foobar' })
      expect(plugin.input.ExternalId).toEqual('foobar')
    })

    it('sets "Policy" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ policy: 'foobar' })
      expect(plugin.input.Policy).toEqual('foobar')
    })

    it('sets "PolicyArns" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ policyArns: [{ arn: 'foobar' }] })
      expect(plugin.input.PolicyArns).toEqual([{ arn: 'foobar' }])
    })

    it('sets an empty array as "PolicyArns" to assume role inputs if "custom" configuration is not set', () => {
      const plugin = subject({})
      expect(plugin.input.PolicyArns).toEqual([])
    })

    it('sets "RoleArn" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ roleArn: 'foobar' })
      expect(plugin.input.RoleArn).toEqual('foobar')
    })

    it('sets "RoleSessionName" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ roleSessionName: 'foobar' })
      expect(plugin.input.RoleSessionName).toEqual('foobar')
    })

    it('sets "SerialNumber" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ serialNumber: 'foobar' })
      expect(plugin.input.SerialNumber).toEqual('foobar')
    })

    it('sets "SourceIdentity" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ sourceIdentity: 'foobar' })
      expect(plugin.input.SourceIdentity).toEqual('foobar')
    })

    it('sets "Tags" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ tags: [{ key: 'foo', value: 'bar' }] })
      expect(plugin.input.Tags).toEqual([{ Key: 'foo', Value: 'bar' }])
    })

    it('sets an empty array as "Tags" to assume role inputs if "custom" configuration is not set', () => {
      const plugin = subject({})
      expect(plugin.input.Tags).toEqual([])
    })

    it('sets "TokenCode" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ tokenCode: 'foobar' })
      expect(plugin.input.TokenCode).toEqual('foobar')
    })

    it('sets "TransitiveTagKeys" to assume role inputs from "custom" configuration', () => {
      const plugin = subject({ transitiveTagKeys: ['foo', 'bar'] })
      expect(plugin.input.TransitiveTagKeys).toEqual(['foo', 'bar'])
    })

    it('sets an empty array as "TransitiveTagKeys" to assume role inputs if "custom" configuration is not set', () => {
      const plugin = subject({})
      expect(plugin.input.TransitiveTagKeys).toEqual([])
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
      /*
       * PolicyDectatorType
       * See: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sts/interfaces/policydescriptortype.html
       */
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
      /*
       * PolicyDectatorType
       * See: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sts/interfaces/policydescriptortype.html
       */
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
})
