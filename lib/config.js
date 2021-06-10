/*
*
* Exports for conf variables
*
*/

const { type } = require("os");

var environments = {};

// Staging (default)
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging',
  'hashingSecret': 'verySecretive',
  'maxChecks': 5,
  'twilio': {
    'accountSid': '',
    'authToken': '',
    'fromPhone': ''
  }
};

// Production
environments.production = {
  'httpPort': 8080,
  'httpsPort': 8081,
  'envName': 'production',
  'hashingSecret': 'verySecretive',
  'maxChecks': 5,
  'twilio': {
    'accountSid': '',
    'authToken': '',
    'fromPhone': ''
  }
};

//Determine what should be exported
var currentEnv = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check the if current env is given, default to staging
var envToExport = typeof (environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

//Export the module
module.exports = envToExport;