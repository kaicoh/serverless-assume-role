import * as Serverless from 'serverless'
import * as Plugin from 'serverless/classes/Plugin'

export interface AssumeRoleInputs {
  durationSeconds: undefined | number
  externalId: undefined | string
  policy: undefined | string
  policyArns: undefined | Array<{ arn: undefined | string }>
  roleArn: undefined | string
  roleSessionName: undefined | string
  serialNumber: undefined | string
  sourceIdentity: undefined | string
  tags: undefined | Array<{ Key: undefined | string, Value: undefined | string }>
  tokenCode: undefined | string
  transitiveTagKeys: undefined | string[]
}

export interface ServerlessExtensions {
  classes: {
    Error: ErrorConstructor
  }
}

/*
 * @serverless/utils
 * Ref: https://www.npmjs.com/package/@serverless/utils
 */
export interface ServerlessUtils {
  log: Plugin.Logging['log']
}

export type ServerlessV3 = Serverless & ServerlessExtensions
