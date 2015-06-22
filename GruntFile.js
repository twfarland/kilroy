module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: ''
      },
      test: {
        src: ['src/kilroy.js', 'src/endWithExports.js'],
        dest: 'test/<%= pkg.name %>.js'
      },
      dist: {
        src: ['src/kilroy.js', 'src/end.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    jshint: {
      files: ['Gruntfile.js', '<%= concat.test.dest %>']
    },

    qunit: {
      files: ['test/tests.html']
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'qunit']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('test', ['concat:test', 'jshint', 'qunit']);
  grunt.registerTask('default', ['concat:dist', 'uglify']);

};