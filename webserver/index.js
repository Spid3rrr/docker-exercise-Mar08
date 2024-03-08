// content of index.js
const http = require("http");
const url = require('url');
const port = 3030;
const message = process.env.MESSAGE || "default msg";
const mysql = require("mysql");
var con = mysql.createConnection({
  host: process.env.DB_HOST || "no host",
  user: process.env.DB_USER || "no user",
  password: process.env.DB_PASS || "no pass",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

con.query("CREATE DATABASE IF NOT EXISTS msgdb", function (err, result) {
  if (err) throw err;
  console.log("Database created");
});

con.query("USE msgdb", function (err, result) {
  if (err) throw err;
  console.log("Database selected");
});

con.query(
  "CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY, message VARCHAR(255))",
  function (err, result) {
    if (err) throw err;
    console.log("Table created");
  }
);

const writeMessageHandler = (request, response) => {
  const queryObject = url.parse(request.url,true);
  const msg = queryObject.query.message;
  if(!msg) {
    response.writeHead(401, {'Content-Type': 'text/plain'});
    response.end('No message provided');
    return;
  }

  console.log("Message: " + msg);
  con.query(
    `INSERT INTO messages (message) VALUES ('${msg}')`,
    function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    }
  );
  response.end("Message written");
};

const readMessagesHandler = (request, response) => {
  con.query("SELECT * FROM messages", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
    response.end(JSON.stringify(
      {
        server: process.env.SERVERNUM,
        messages: result,
      }
    ));
  });
};

const helloRequestHandler = (request, response) => {
  console.log(request.url);
  response.end(message);
};

const server = http.createServer((request, response) => {
  console.log(request.url);
  if (request.url.split("?")[0] === "/write") {
    writeMessageHandler(request, response);
  } else if (request.url === "/read") {
    readMessagesHandler(request, response);
  } else {
    helloRequestHandler(request, response);
  }
});

server.listen(port, (err) => {
  if (err) {
    return console.log("something bad happened", err);
  }
  console.log(`server is listening on ${port}`);
});
