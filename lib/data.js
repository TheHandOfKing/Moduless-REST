/*
*
*
*   Lib for storing and editing data
*
*/

//Dependencies
const fs = require('fs');
const path = require('path'); //normalize paths to different dirs
const helpers = require('./helpers');

//Container for the module to export

let lib = {
};

//Base dir of .data folder

lib.baseDir = path.join(__dirname, '/../.data/');

//Write data to a file

lib.create = (dir, file, data, cb) => {
  //open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      //Convert data to string
      let stringData = JSON.stringify(data);

      //Write to file and close
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              cb(false);
            } else {
              cb('Error closing');
            }
          });
        } else {
          cb('Error writing to new file');
        }
      })
    } else {
      cb('Could not create file')
    }
  });
}

lib.read = (dir, file, cb) => {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
    if (!err && data) {
      let parsedData = helpers.parseJsonToObject(data);
      cb(false, parsedData);
    } else {
      cb(err, data);
    }
  })
}

lib.update = (dir, file, data, cb) => {
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      //Convert to string
      let stringData = JSON.stringify(data);
      //Truncate
      fs.ftruncate(fileDescriptor, (err) => {
        if (!err) {
          //Write and close
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  cb(false)
                } else {
                  cb('Error closing the file')
                }
              })
            } else {
              cb('Error writing to existing')
            }
          })
        } else {
          callback('Failed to truncate');
        }
      })
    } else {
      cb('Could not open the file')
    }
  })
}

lib.delete = (dir, file, cb) => {
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
    if (!err) {
      cb(false);
    } else {
      cb('Error with deletion')
    }
  })
}



module.exports = lib;