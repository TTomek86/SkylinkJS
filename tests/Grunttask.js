var fs = require('fs');
var path = require('path');
var config = require('./config.js');

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

module.exports = function(gruntConfig) {
  var gruntTask = ['dev', 'clean:test'];

  // Prevent undefined errors
  config = config || {};
  config.run = config.run || {};
  config.run.browsers = config.run.browsers || [];
  config.run.webDriver = config.run.webDriver || {};
  config.run.certificates = config.run.certificates || {};

  if (typeof config.run.webDriver.host !== 'string') {
    config.run.webDriver.host = '';
  }

  if (typeof config.run.webDriver.port !== 'number') {
    config.run.webDriver.port = 4444;
  }

  // The list of browsers (to kill after opening in karma)
  var killBrowsers = [];
  // The list of browsers
  var browsers = (function () {
    var list = {
      'IE': 'IE',
      'chrome': 'ChromeCustom',
      'firefox': 'FirefoxCustom',
      'opera': 'Opera',
      'safari': 'Safari'
      //'webdriver': 'IEWebDriver'
    };
    var array = [];
    for (var b = 0; b < config.run.browsers.length; b++) {
      var brows = config.run.browsers[b];
      if (list.hasOwnProperty(brows)) {
        array.push(list[brows]);
        if (['opera', 'safari'].indexOf(brows) > -1) {
          var appBrows = brows.charAt(0).toUpperCase() + brows.slice(1);
          killBrowsers.push('osascript -e \'open app "' + appBrows + '"\'');
          killBrowsers.push('osascript -e \'quit app "' + appBrows + '"\'');
        }
      }
    }
    return array;
  })();

  // Dependencies
  var dependencies = [{
      pattern: 'https://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/hmac-sha1.js',
      included: true
    }, {
      pattern: 'https://crypto-js.googlecode.com/svn/tags/3.1.2/build/components/enc-base64-min.js',
      included: true
    }, {
      pattern: __dirname + '/config.js',
      included: true
    }, {
      pattern: __dirname + '/../node_modules/adapterjs/publish/adapter.screenshare.js',
      included: true
    }, {
      pattern: __dirname + '/../node_modules/socket.io-client/socket.io.js',
      included: true
    }, {
      pattern: __dirname + '/../publish/skylink.debug.js',
      included: true
    }, {
      pattern: __dirname + '/tests/utils.js',
      included: true
  }];

  // grunt-clean task
  gruntConfig.clean = gruntConfig.clean || {};
  gruntConfig.clean.test = ['tests/karma/gen/*', 'tests/reporters/*', 'tests/coverage/*'];

  // grunt-replace task
  gruntConfig.replace = gruntConfig.replace || {};

  // grunt-concat task
  gruntConfig.concat = gruntConfig.concat || {};

  var folders = getDirectories(__dirname + '/tests/units');

  for (var j = 0; j < folders.length; j++) {
    // Get the list of test units
    var units = fs.readdirSync(__dirname + '/tests/units/' + folders[j]);

    // add-on grunt-replace-tasks
    // loop through every unit test
    for (var i = 0; i < units.length; i++) {
      // Test unit
      var tUnit = units[i].split('.js')[0];

      var tFiles = dependencies.concat([{
          pattern: __dirname + '/tests/units/' + folders[j] + '/' + tUnit + '.js',
          included: true
      }]);

      var tPreprocessor = {};
      tPreprocessor[__dirname + '/tests/units/' + folders[j] + '/' + tUnit + '.js'] = ['coverage'];

      // Replace the information and output to a temp folder for this test key
      gruntConfig.replace[folders[j] + '_' + tUnit] = {
        options: {
          variables: {
            hostname: config.run.host || 'localhost',
            port: parseInt('50' + i + /*j*/ '0', 10),
            browser: browsers,
            files: tFiles,
            preprocessor: tPreprocessor,
            htmlReporter: {
              outputFile: __dirname + '/reporters/' + folders[j] + '/' + tUnit + '.html',
              pageTitle: 'Unit tests for ' + tUnit, //+ ' in ' + tBrowser.id,
              subPageTitle: 'Tested browsers: ' + browsers.join(', ')
            },
            coverageDir: __dirname + '/coverage/' + folders[j] + '/' + tUnit + '/',
            coverageFile: 'index.html',
            driverhost: config.run.webDriver.host,
            driverport: config.run.webDriver.port,
            certificateKey: __dirname + '/../certificates/' + config.run.certificates.key,
            certificateCert: __dirname + '/../certificates/' + config.run.certificates.crt
          },
          prefix: '@@'
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['tests/karma/template.conf.js'],
          dest: 'tests/karma/gen/' + folders[j] + '/' + tUnit + '-temp'
        }]
      };
      gruntTask.push('replace:' + folders[j] + '_' + tUnit);

      // "Concat" to output to the actual generated dir
      gruntConfig.concat[folders[j] + '_' + tUnit] = {
        files: {}
      };
      gruntConfig.concat[folders[j] + '_' + tUnit].files['tests/karma/gen/' + folders[j] + '/' + tUnit + '.conf.js'] =
        ['tests/karma/gen/' + folders[j] + '/' + tUnit + '-temp/template.conf.js'];
      gruntTask.push('concat:' + folders[j] + '_' + tUnit);

      // Clean away and destroy the temp folder
      gruntConfig.clean[folders[j] + '_' + tUnit] = ['tests/karma/gen/' + folders[j] + '/' + tUnit + '-temp/'];
      gruntTask.push('clean:' + folders[j] + '_' + tUnit);
    }
  }

  // add-on grunt-shell-tasks
  gruntConfig.shell = {
    clicker: {
      command: 'osascript tests/bash/mac-clicker.scpt',
      options: {
        execOptions: {
          setsid: true
        },
        async: true
      }
    },
    runner: {
      command: 'sh tests/bash/run.sh',
      options: {
        stdin: false,
        execOptions: {
          setsid: true
        },
        async: false
      }
    },
    cleanrunner: {
      command: (function () {
        var killBrowsers = ['opera', 'safari'];
        var array = [];
        for (var b = 0; b < killBrowsers.length; b++) {
          if (config.run.browsers.indexOf(killBrowsers[b]) > -1) {
            var appName = killBrowsers[b].charAt(0).toUpperCase() + killBrowsers[b].slice(1);
            array.push('osascript tests/bash/kill-run.scpt ' + appName);
            array.push('pkill ' + appName);
          }
        }
        return array;
      })().join('&&'),
      options: {
        stdin: false,
        execOptions: {
          setsid: true
        },
        async: false
      }
    }
  };

  gruntTask.push('shell:clicker');
  gruntTask.push('shell:runner');
  gruntTask.push('shell:cleanrunner');

  return gruntTask;
};
