var deltree = cadence(function (cadence, directory) {
  cadence(function () {
    fs.readdir(directory, cadence());
  }, function (error) {
    if (error.code != "ENOENT") cadence(error);
    else cadence(null, []);
  }, function shift (files, rmdir) {
    if (files.length) return path.resolve(directory, files.shift());
    else rmdir();
  }, function (file) {
    fs.stat(file, cadence());
  }, function (stat, file, shift) {
    if (stat.isDirectory()) deltree(file, cadence(shift));
    else fs.unlink(file, cadence(shift));
  }, function rmdir () {
    fs.rmdir(directory, cadence());
  });
});

var deltree = cadence(function (cadence, directory) {
  var errors = [];
  cadence(function () {
    fs.readdir(directory, cadence());
  }, function (error) {
    if (error.code != "ENOENT") cadence(error);
    else cadence(null, []);
  }, function (files) {
    files.forEach(function (file) {
      file = path.resolve(directory, file);
      cadence(function () {
        fs.stat(file, cadence());
      }, function (stat) {
        if (stat.isDirectory()) deltree(file, cadence());
        else fs.unlink(file, cadence());
      }, function (error) {
        if (error.code != "ENOENT") {
          error.file = file;
          errors.push(error);
        }
      });
    },
  }, function () {
    fs.rmdir(directory, cadence());
  }, function (error) {
    error.causes = errors;
    throw error;
  });
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
