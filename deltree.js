
var cadence = require('cadence')()
  , fs = require('fs')
  ;

var deltree = cadence(function (cadence, directory)
  cadence(function () {
    fs.readdir(directory, cadence());    
  }, function (error, files) {
    // Messy.
    if (error) {
      if (error.code != "ENOENT") throw error;
      cadence(null);
    } else {
      files.forEach(function (file, i) {
        fs.stat(path.resolve(directory, file), cadence(i));
      });
    }
  }, function (stats, files) {
    files.forEach(function (file, i) {
      if (stat[i].isDirectory()) deltree(file, cadence());
      else fs.unlink(file, cadence());
    });
  }, cadence);
});

var deltree = cadence(function (cadence, directory)
  cadence(function () {
    fs.readdir(directory, cadence());    
  }, function (error, files) {
    if (error) {
      if (error.code != "ENOENT") throw error;
      cadence(null);
    } else {
      files.forEach(function (file, i) {
        fs.stat(path.resolve(directory, file), cadence({ file: file, stat: cadence(0) }));
      });
    }
  }, function (objects) {
    objects.forEach(function (object) {
      if (object.stat.isDirectory()) deltree(object.file, cadence());
      else fs.unlink(object.file, cadence());
    }); 
  }, cadence);
});

var deltree = cadence(function (cadence, directory) {
  cadence(function () {
    fs.readdir(directory, cadence());    
  }, function (error) {
    // Check. Skipped if no error.
    if (error.code != "ENOENT") throw error;
    return [];
  }, function next (files) {
    // Continue.
    if (!files.length) cadence(null);
    else return path.resolve(directory, files.shift());
  }, function (file) {
    fs.stat(file, cadence());
  }, function (stat, file) {
    if (stat.isDirectory()) deltree(file, cadence(next));
    else fs.unlink(file, cadence(next));
  });
});

var deltree = cadence(function (cadence, directory) {
  cadence(function () {
    fs.readdir(directory, cadence());    
  }, function (error, files) {
    if (error) {
      if (error.code != "ENOENT") throw error;
      cadence().files = [];
    }
  }, function /* parallel ? */ (files) {
      files.forEach(function (file, i) {
        // Serial, but I want parallel. One or the other. Parallel by default?
        // Serial by default?
        cadence(/* TODO WAIT! They are called immediately! */function () {
          fs.stat(path.resolve(directory, file), cadence());
        }, function (stat) {
          if (stat.isDirectory()) deltree(file, cadence());
          else fs.unlink(file, cadence());
        });
      });
    }
  }, cadence);
});
