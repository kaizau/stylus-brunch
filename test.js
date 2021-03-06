var expect = require('chai').expect;
var Plugin = require('./');
var fs = require('fs');
var sysPath = require('path');
var fixturesPath = sysPath.resolve(__dirname, 'fixtures');

describe('Plugin', function() {
  var plugin;
  var fileName = 'app/styles/style.styl';

  beforeEach(function() {
    plugin = new Plugin({
      paths: {
        root: ''
      },
      plugins: {
        stylus: {
          paths: [fixturesPath],
          defines: {
            url: require('stylus').url()
          }
        }
      }
    });
  });

  it('should be an object', function() {
    expect(plugin).to.be.ok;
  });

  describe('#compile', function() {
    it('should have #compile method', function() {
      expect(plugin.compile).to.be.an.instanceof(Function);
    });

    it('should compile and produce valid result', function(done) {
      var urlTest = {
        imagePath: './dot.jpg'
      }

      urlTest.base64 = fs.readFileSync(fixturesPath + '/' + urlTest.imagePath).toString('base64');
      var content = 'body\n  font: 12px Helvetica, Arial, sans-serif\n  background: url("' + urlTest.imagePath + '")';
      var expected = 'body {\n  font: 12px Helvetica, Arial, sans-serif;\n  background: url("data:image/jpeg;base64,' + urlTest.base64 + '");\n}\n';

      plugin.compile({data: content, path: fileName}).then(data => {
        expect(data.data).to.equal(expected)
        done();
      }, error => expect(error).to.equal(null));
    });

    it('should compile and import from config.stylus.paths', function(done){
      var content = "@import 'path_test'\n";
      var expected = '.test {\n  color: #fff;\n}\n';

      plugin.compile({data: content, path: fileName}).then(data => {
        expect(data.data).to.equal(expected);
        done();
      }, error => expect(error).to.equal(null));
    });
  });

  describe('getDependencies', function() {
    it('should output valid deps', function(done) {
      var content = "\
@import unquoted\n\
@import 'valid1'\n\
@import '__--valid2--'\n\
@import \"./valid3.styl\"\n\
@import '../../vendor/styles/valid4'\n\
@import 'nib'\n\
// @import 'commented'\n\
";

      var expected = [
        sysPath.join('app', 'styles', 'unquoted.styl'),
        sysPath.join('app', 'styles', 'valid1.styl'),
        sysPath.join('app', 'styles', '__--valid2--.styl'),
        sysPath.join('app', 'styles', 'valid3.styl'),
        sysPath.join('vendor', 'styles', 'valid4.styl')
      ];

      plugin.getDependencies(content, fileName, function(error, dependencies) {
        expect(error).not.to.be.ok;
        expect(dependencies).to.eql(expected);
        done();
      });
    });
  });
});
