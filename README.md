# serverless-assume-role

[![Serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![main](https://github.com/kaicoh/serverless-assume-role/actions/workflows/test.yml/badge.svg)](https://github.com/kaicoh/serverless-assume-role/actions)
[![Coverage Status](https://coveralls.io/repos/github/kaicoh/serverless-assume-role/badge.svg?branch=main)](https://coveralls.io/github/kaicoh/serverless-assume-role?branch=main)

A Serverless framework plugin to enable AWS assume role.

## Installation

Run this command.

```
$ npm install --save-dev serverless-assume-role
```

And add the following to your serverless.yml file

```
plugins:
  - serverless-assume-role

custom:
  assumeRole:
    stages:
      # The stages this plugin executes Assume Role action.
      - stg
      - prod
    params:
      # These are all the same parameter to what AWS API uses.
      # But the parameter names are all camelCased.
      # If you want more details for each parameter, see AWS Documentation.
      # https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html
      roleArn: arn:aws:iam::012345678901:role/your-role-name
      externalId: my-external-id
      roleSessionName: serverless-framework-deployment
```

It's done! Now when you run `serverless deploy --stage stg` or `serverless deploy --stage prod`, this plugin executes `AssumeRole` action before the deployment and then deploys your package with the IAM Role.

## License

This software is released under the [MIT License](LICENSE).
