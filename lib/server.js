//Dependencies
const config = require('./lib/config');
const http = require('http');
const https = require('https');
const url = require('url');
const helpers = require('./lib/helpers');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs')
const handlers = require('./lib/handlers');

//Instantiate the http server

let httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
})

//Listen to port
httpServer.listen(config.httpPort, () => {
  console.log('Listening on ' + config.httpPort)
})

//Inst the https


//start https
//All the server logic for both http and https
let unifiedServer = function (req, res) {
  //Get url
  let parsedUrl = url.parse(req.url, true);
  //Get path
  let path = parsedUrl.pathname; // gets the url after http:localhost.com/
  let trimmedPath = path.replace(/^\/+|\/+$/g, ''); // just eliminates extra / eg /foo//// is same as /foo

  //get query string as an object
  let queryString = parsedUrl.query;

  //Get http method
  let method = req.method.toLowerCase();

  //get headers as an object
  let headers = req.headers;

  //get payload if any
  let decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    //Choose a handler
    let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
    //construct the data object
    let data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryString,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    //ROute the request to the handler speced in the router
    chosenHandler(data, (statusCode, payload) => {
      //default status or a given
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
      //payload or default to empty
      payload = typeof (payload) == 'object' ? payload : {};
      // COnvert the payload to string
      let payloadString = JSON.stringify(payload);

      //return the response and set the header
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode);
      res.end(payloadString);
      //Log the path
      console.log('Returning response ', statusCode, payloadString);
    })
  })
}

//Define a router
let router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks
}