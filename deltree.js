var deltree = cadence(function (cadence, directory) {
  cadence(function () {
    fs.readdir(directory, cadence());
  }, function (error) {
    if (error.code != "ENOENT") cadence(error);
    else cadence(null); 
  }, function shift (files) {
    if (files.length) return path.resolve(directory, files.shift());
    else cadence(rmdir);
  }, function (file) {
    fs.stat(file, cadence());
  }, function (stat, file) {
    if (stat.isDirectory()) deltree(file, cadence(shift));
    else fs.unlink(file, cadence(shift));
  }, function rmdir () {
    fs.rmdir(directory, cadence());
  });
});

var deltree = cadence(function (cadence, directory) {
  cadence(function () {
    fs.readdir(directory, cadence());
  }, function (error) {
    if (error.code != "ENOENT") cadence(error);
    else cadence(null); 
  }, function (files) {
    files.forEach(function () {
      cadence(function () {
        fs.stat(file, cadence());
      }, function (stat) {
        if (stat.isDirectory()) deltree(file, cadence());
        else fs.unlink(file, cadence());
      });
    }, 
  }, function exit () {
    fs.rmdir(directory, cadence());
  });
});
