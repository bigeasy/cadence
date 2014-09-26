var d = require('domain').create(), fs = require('fs');

d.on('error', function (error) {
  console.log(error);
});

d.run(function () {
  fs.readFile(__filename, 'utf8', function (error, body) {
    console.log(body);
  });
});
