import * as Serverless from 'serverless'
import * as Plugin from 'serverless/classes/Plugin'
import { AssumeRoleCommandInput, PolicyDescriptorType, Tag } from '@aws-sdk/client-sts'
import { ServerlessV3, ServerlessUtils } from './types'

export default class ServerlessAssumeRole {
  serverless: ServerlessV3
  options: Serverless.Options
  log: ServerlessUtils['log']
  input: AssumeRoleCommandInput
  hooks: Plugin.Hooks
  commands: Plugin.Commands

  constructor (
    serverless: ServerlessV3,
    options: Serverless.Options,
    utils: ServerlessUtils
  ) {
    this.serverless = serverless
    this.options = options
    this.log = utils.log
    this.input = this.getAssumeRoleInput()

    this.commands = {
      'assumerole:test': {
        usage: 'My custom command',
        lifecycleEvents: ['run']
      }
    }

    this.hooks = {
      'assumerole:test:run': this.run.bind(this),
      'before:deploy:deploy': this.run.bind(this)
    }
  }

  private getAssumeRoleInput (): AssumeRoleCommandInput {
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
      PolicyArns: policyArns ?? [],
      RoleArn: roleArn,
      RoleSessionName: roleSessionName,
      SerialNumber: serialNumber,
      SourceIdentity: sourceIdentity,
      Tags: toTags(tags),
      TokenCode: tokenCode,
      TransitiveTagKeys: transitiveTagKeys ?? []
    }
  }

  run (): void {
    this.log.notice('test')
  }

  error (message?: string): Error {
    return new this.serverless.classes.Error(message)
  }
}

function isPolicyDescriptorType (obj: any): obj is PolicyDescriptorType {
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

function toTags (tags: any[] | undefined): Tag[] {
  if (tags === undefined) {
    return []
  }
  return tags.map(({ key, value }) => ({ Key: key, Value: value }))
}

module.exports = ServerlessAssumeRole
