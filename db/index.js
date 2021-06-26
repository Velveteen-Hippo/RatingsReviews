const {Client} = require('pg');
const psqlConfig = require('./config.js');
const client = new Client(psqlConfig);

client.connect((err) => {
  if (err) {
    console.log('Connection failed to psql server');
  } else {
    console.log('Connected to psql server');
  }
});

module.exports = client;