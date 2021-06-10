/*

  helpers for various tasks

*/

//Dependencies
let crypto = require('crypto');
let config = require('./config');
const https = require('https');
const querystring = requier('querystring');

let helpers = {};

helpers.hash = (passwordToHash) => {
  if (typeof (passwordToHash) == 'string' && passwordToHash.length > 0) {
    let hash = crypto.createHmac('sha256', config.hashingSecret).update(passwordToHash).digest('hex');
    return hash;
  } else {
    return false;
  }
}

helpers.parseJsonToObject = (str) => {
  try {
    let obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
}

//Create a string of random characters when len is passed

helpers.createRandomString = (ln) => {
  ln = typeof (ln) == 'number' && ln > 0 ? ln : false;
  if (ln) {
    //Define the pattern to create
    let possibleChar = 'abcdefghijklnopqrstuvwxyz1234567890_-'

    let str = '';

    for (let i = 0; i < ln; i++) {
      //get a random char
      let randChar = possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));

      //Append to str
      str += randChar;
    }

    //Return the final string

    return str;
  } else {
    return false;
  }
}

helpers.sendTwilioSms = (phone, msg, cb) => {
  phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
  if (phone && msg) {
    //Conigure the request payload
    let payload = {
      'From': config.twilio.fromPhone,
      'To': '+381' + phone,
      'Body': msg
    }

    //Stringify the payload
    let stringPayload = querystring.stringify(payload)
    //Configure the request details
    let requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    //Instantiate the request object
    let req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      let status = res.statusCode;
      //Cb success if req went through
      if (status == 200 || status == 201) {
        cb(false);
      } else {
        cb('Status code returned was ' + status);
      }
    });

    //Bind to the error event so it doesnt get thrown
    req.on('error', (e) => {
      cb(e)
    });

    //Add the payload to the request
    req.write(stringPayload);

    //End the request
    req.end();
  } else {
    cb('Given params are invalid or missing')
  }
}

module.exports = helpers;