
//Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

let app = {};

//Init function
app.init = () => {
  //Start the server
  server.init()
  //Start the workers
  workers.init()
};

//Execute unction
app.init();

module.exports = app;