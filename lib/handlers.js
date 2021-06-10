/*

  Request handlers

*/

//Dependencies
const { time } = require('console');
const { type } = require('os');
const config = require('./config');
const _data = require('./data');
const { hash } = require('./helpers');
const helpers = require('./helpers');


//Define handlers
let handlers = {};

//Users
handlers.users = (data, cb) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, cb);
  } else {
    cb(405);
  }
}
//Container for user submethods
handlers._users = {};
//post
//Reqs finame, lname, phone, pw, tos
handlers._users.post = (data, cb) => {
  //check that all required fields are filledd out
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let tosAggr = typeof (data.payload.tosAggr) == 'boolean' && data.payload.tosAggr == true ? true : false;

  if (firstName) {
    //Make sure user already exists, if so break
    _data.read('users', phone, (err, data) => {
      if (err) {
        // Hash the pw
        let hashedPw = helpers.hash(password);
        //Create the user object
        if (hashedPw) {
          let userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'phone': phone,
            'hashedPassword': hashedPw,
            'tosAggr': true
          }
          //Store the user
          _data.create('users', phone, userObject, (err) => {
            if (!err) {
              cb(200);
            } else {
              console.log(err);
              cb(500, { 'Error': 'Could not create new user' })
            }
          })
        } else {
          cb(500, { 'Error': 'Could not hash user password' });
        }
      } else {
        cb(400, { 'Error': 'User with the associated phone exists, did you mean to register?' })
      }
    })
  } else {
    cb(400, { 'Error': 'Some credentials are not filled' })
  }
}

//get
//Required data: phone
//Opt data: none
handlers._users.get = (data, cb) => {
  let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    //Get the token from headers
    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    //verify the token
    handlers._tokens.verifyToken(token, phone, (isValid) => {
      if (isValid) {
        //Lookup the user
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            //Remove hashed pw from user object before returning the obj to the requestor
            delete data.hashedPassword;
            cb(200, data);
          } else {
            cb(404);
          }
        })
      } else {
        cb(403, { 'Error': 'Missing token or token invalid' })
      }
    })
  } else {
    cb(400, { 'Error': 'Missing required field' })
  }
}

//put
//phone
//opt data, fname, lname, password, at least one ||
//auth helper or something
handlers._users.put = (data, cb) => {
  //check for the required field
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let tosAggr = typeof (data.payload.tosAggr) == 'boolean' && data.payload.tosAggr == true ? true : false;

  //Error if phone is invalid
  if (phone) {
    //If nothing
    if (firstName || lastName || password) {

      let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

      handlers._tokens.verifyToken(token, phone, (isValid) => {
        if (isValid) {
          //Lookup user
          _data.read('users', phone, (err, data) => {
            if (!err && data) {
              if (firstName) {
                data.firstName = firstName;
              }
              if (lastName) {
                data.lastName = lastName;
              }
              if (password) {
                data.hashedPassword = helpers.hash(password);
              }
              //Store
              _data.update('users', phone, user, (err) => {
                if (!err) {
                  cb(200);
                } else {
                  console.lob(err);
                  cb(500, { 'Error': 'Something went wrong' })
                }
              })
            } else {
              cb(400, { 'Err': 'noexist' })
            }
          })
        }
        else {
          cb(403, { 'Error': 'Missing token or token invalid' })
        }
      })
    } else {
      cb(400, { 'Error': 'MIssing fields to update' })
    }
  } else {
    cb(400, { 'Error': 'Missing req field' })
  }
}

//delete
//phone
//@TODO only let auth user delete
handlers._users.delete = (data, cb) => {
  //Check that phone is valid
  let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {

    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, (isValid) => {
      if (isValid) {
        //Lookup the user
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            //Remove hashed pw from user object before returning the obj to the requestor
            _data.delete('users', phone, (err) => {
              if (!err) {
                let userChecks = typeof (data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
                let checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  let checksDeleted = 0;
                  let deletionErrors = false;

                  userChecks.forEach((checkId) => {
                    _datal.delete('checks', checkId, (err) => {
                      if (err) {
                        deletionErrors = true;
                      }

                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          cb(200)
                        } else {
                          cb(500, { 'Error': 'Errors encountered while deleting' })
                        }
                      }
                    })
                  })
                } else {
                  cb(200)
                }
              } else {
                cb(500, { 'Error': 'Something went wrong' })
              }
            });
          } else {
            cb(400, { 'Error': 'Could not find the specified user' });
          }
        })
      } else {
        cb(403, { 'Error': 'Missing token or token invalid' })
      }
    })
  } else {
    cb(400, { 'Error': 'Missing required field' })
  }
}

//Tokens
handlers.tokens = (data, cb) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, cb);
  } else {
    cb(405);
  }
}

//Container for all token methods
handlers._tokens = {};

//Post
//Phone, pw
handlers._tokens.post = (data, cb) => {
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        //Hash the given password
        let hashedPassword = helpers.hash(password);
        if (hashedPassword == data.hashedPassword) {
          //Create a token with the random name, set it's expiration to 1hour
          let tokenId = helpers.createRandomString(20);
          let expires = Date.now() + 1000 * 60 * 60;
          let tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          };

          //Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              cb(200, tokenObject)
            } else {
              cb(500, { 'Error': 'Something went wrong' })
            }
          });
        } else {
          cb(400, { 'Error': 'Password not matching with the input' })
        }
      } else {
        cb(400, { 'Error': 'Could not find user' })
      }
    })
  } else {
    cb(400, { 'Error': 'Missing fields' })
  }
}

//Get
//Id
//Opt none
handlers._tokens.get = (data, cb) => {
  //Check that the id sent is valid
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    //Lookup the user
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        //Remove hashed pw from user object before returning the obj to the requestor
        cb(200, data);
      } else {
        cb(404);
      }
    })
  } else {
    cb(400, { 'Error': 'Missing required field' })
  }
}

//Put
//Required: id, extend
//Opt: none
handlers._tokens.put = (data, cb) => {
  let id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  let extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;

  if (id && extend) {
    //Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        //Check if token not expired
        if (tokenData.expires > Date.now()) {
          //Set expiration to hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          //Store
          _data.update('tokens', id, tokenData, (err) => {
            if (!err) {
              cb(200);
            } else {
              cb(500, { 'Error': 'Could not update tokens' })
            }
          })
        } else {
          cb(400, { 'Error': 'Token has expired and cant be extended' })
        }
      } else {
        cb(400, { 'Error': 'No token' })
      }
    })
  } else {
    cb(400, { 'Error': 'Missing required fields or extend is false' })
  }
}

//Delete
//Req id
//Opt none
handlers._tokens.delete = (data, cb) => {
  //Check that id is valid
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    //Lookup the user
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        //Remove hashed pw from user object before returning the obj to the requestor
        _data.delete('tokens', id, (err) => {
          if (!err) {
            cb(200)
          } else {
            cb(500, { 'Error': 'Something went wrong' })
          }
        });
      } else {
        cb(400, { 'Error': 'Could not find the specified token' });
      }
    })
  } else {
    cb(400, { 'Error': 'Missing required field' })
  }
};

//Verify a given token is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, cb) => {
  //Lookup token
  _data.read('tokens', id, (err, data) => {
    if (!err && data) {
      //Check if token is for given user
      if (data.phone == phone && data.expires > Date.now()) {
        cb(true);
      } else {
        cb(false)
      }
    } else {
      cb(false)
    }
  })
};

//checks
handlers.checks = (data, cb) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, cb);
  } else {
    cb(405);
  }
}

//Container for all token methodds
handlers._checks = {};

//Required data: protocol, url, method, successCodes, timeoutSeconds
//Opt data: none

handlers._checks.post = (data, cb) => {
  //validate inputs
  let protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  let url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  let method = typeof (data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  let successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  let timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if (protocol, url, method, successCodes, timeoutSeconds) {
    // Get the token from headers
    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    //Lookup user by reading the token
    _data.read('tokens', token, (err, data) => {
      if (!err && data) {
        let userPhone = data.phone;

        //lookup data
        _data.read('users', userPhone, (err, data) => {
          if (!err && data) {
            let userChecks = typeof (data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];

            //verify that the user has less than the number of max checks allowed

            if (userChecks.length < config.maxChecks) {
              //Create the random id for check
              let checkId = helpers.createRandomString(20);

              //Create the check object, and include the user phone

              let checkObject = {
                'id': checkId,
                'userPhone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeoutSeconds': timeoutSeconds
              }

              //Save to disk

              _data.create('checks', checkId, checkObject, (err) => {
                if (!err) {
                  //Add the check to the user object and update the array of checks
                  data.checks = userChecks
                  data.checks.push(checkId)

                  //Save
                  _data.update('users', userPhone, data, (err) => {
                    if (!err) {
                      //Return the data for the new check
                      cb(200, checkObject)
                    } else {
                      cb(500, { 'Error': 'Something went wrong' })
                    }
                  })
                } else {
                  cb(500, { 'Error': 'Could not create the new check' })
                }
              })

            } else {
              cb(400, { 'Error': 'The user already has the max of checks (' + config.maxChecks + ')' })
            }
          } else {
            cb(403)
          }
        })
      } else {
        cb(403)
      }
    })

  } else {
    cb(400, { 'Error': 'Missing required inputs, or are invalid' })
  }
};

//Checks-get
//requ data id
//opt none
handlers._checks.get = (data, cb) => {
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  console.log(id)
  if (id) {
    //Lookup the check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        //Get the token from headers
        let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        //verify the token and belongs to the user
        handlers._tokens.verifyToken(token, checkData.userPhone, (isValid) => {
          if (isValid) {
            //Lookup the user
            cb(200, checkData)
          } else {
            cb(404)
          }
        })
      } else {
        cb(404)
      }
    })
  } else {
    cb(400, { 'Error': 'Missing required field' })
  }
}

//handlers put
// required data id
//optional protocol. url, method, successCodes, timeoutSeconds, one must be sent
handlers._checks.put = (data, cb) => {
  //check for required
  //check for the required field
  let id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  let protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  let url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  let method = typeof (data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  let successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  let timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  //Check if one or more optionals is included
  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      //Lookup
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          //Get the token from headers
          let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
          //verify the token
          handlers._tokens.verifyToken(token, phone, (isValid) => {
            if (isValid) {
              if (protocol) {
                checkData.protocol = protocol;
              }

              if (url) {
                checkData.url = url;
              }

              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }

              _data.update('checks', id, checkData, (err) => {
                if (!err) {
                  cb(200)
                } else {
                  cb(500, { 'Error': 'Could not update the check' })
                }
              })
            } else {
              cb(403)
            }
          })
        } else {
          cb(400, { 'Error': 'Check id did not exist' })
        }
      })
    } else {
      cb(400, { 'Error': 'Missing fields to update' })
    }
  } else {
    cb(400, { 'Error': 'Missing required fields' })
  }
}

//id is required
handlers._checks.delete = (data, cb) => {
  //Check that id is valid
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    //Lookup the user
    _data.read('checks', id, (err, data) => {
      if (!err && data) {
        //Get the token from headers
        let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        //verify the token
        handlers._tokens.verifyToken(token, data.userPhone, (isValid) => {
          if (isValid) {

            // delete check data
            _data.delete('checks', id, (err) => {
              if (!err) {
                //Lookup the user
                _data.read('users', data.userPhone, (err, userData) => {
                  if (!err && userData) {
                    let userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                    //Remove delete check from list of checks
                    let checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      //Remove
                      userChecks.splice(checkPosition, 1);
                      _data.update('users', data.userPhone, userData, (err) => {
                        if (!err) {
                          cb(200)
                        } else {
                          cb(500, { 'Err': 'Could not update user' })
                        }
                      })
                    } else {
                      cb(500, { 'Error': 'Could not find check on the user object' })
                    }
                  } else {
                    cb(500, { 'Error': 'Could not do shit' });
                  }
                })
              } else {
                cb(500, { 'Error': 'Could not delete' })
              }
            })
          } else {
            cb(403, { 'Error': 'Missing token or token invalid' })
          }
        })
      } else {
        cb(400, { 'Error': 'Could not find the specified check' });
      }
    })
  } else {
    cb(400, { 'Error': 'Missing required field' })
  }
}


//ping
handlers.ping = function (data, cb) {
  cb(200);
}

//Not found
handlers.notFound = function (data, cb) {
  cb(404);
}

module.exports = handlers;