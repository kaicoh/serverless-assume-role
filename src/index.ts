import * as Serverless from 'serverless'
import * as Plugin from 'serverless/classes/Plugin'

export default class ServerlessAssumeRole {
  serverless: Serverless
  options: Serverless.Options
  log: Plugin.Logging['log']
  hooks: Plugin.Hooks
  commands: Plugin.Commands

  constructor (
    serverless: Serverless,
    options: Serverless.Options,
    utils: Plugin.Logging
  ) {
    this.serverless = serverless
    this.options = options
    this.log = utils.log

    this.commands = {
      'assumerole:test': {
        usage: 'My custom command',
        lifecycleEvents: ['run']
      }
    }

    this.hooks = {
      'assumerole:test:run': this.run.bind(this)
    }
  }

  run (): void {
    this.log.error('error')
    this.log.warning('warning')
    this.log.notice('notice')
    this.log.info('info')
    this.log.debug('debug')
  }
}

module.exports = ServerlessAssumeRole
