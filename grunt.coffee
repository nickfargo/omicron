{ exec } = require 'child_process'
fs       = require 'fs'
path     = require 'path'
util     = require 'util'
O        = require './omicron'

tasks = "lint min qunit publish docco"

fs.copy = ( source, target, callback ) ->
  fs.stat target, ( err ) ->
    return callback new Error "#{target} exists" unless err
    fs.stat source, ( err ) ->
      return callback err if err
      read = fs.createReadStream source
      write = fs.createWriteStream target
      util.pump read, write, callback

module.exports = ( grunt ) ->
  prj = 'omicron'
  pub = "../#{prj}--gh-pages/"
  min = '-min'
  ext = '.js'

  grunt.initConfig
    uglify: {}

    min:
      js:
        src:  prj + ext
        dest: prj + min + ext

    lint:
      target: prj + ext

    jshint:
      options: O.assign( """
        node browser
        eqeqeq immed noarg undef
        boss eqnull expr proto sub supernew multistr validthis laxbreak
        """, true )
      globals:
        O: true

    watch:
      files: '<config:min.js.src>'
      tasks: tasks

    server:
      port: 8001
      base: '..'

    qunit:
      files: 'test/**/*.html'

  grunt.registerTask 'publish', '', ->

  grunt.registerTask 'docco', '', ->
    docco = ->
      exec 'docco omicron.js', mkdir

    mkdir = ( err ) ->
      fs.mkdir pub + 'source', move

    move = ( err ) ->
      map =
        "docs/omicron.html" : pub + "source/index.html"
        "docs/docco.css"    : pub + "source/docco.css"
      n = 0
      incr = ( err ) -> if err then --n else continuation err if ++n is 2
      fs.rename k, v, incr for k,v of map
      continuation = rmdir

    rmdir = ( err ) ->
      fs.rmdir 'docs'

    do docco

  grunt.registerTask 'cleanup', '', ->
    logError = ( err ) -> console.log err if err
    fs.unlink 'grunt.js', logError

  grunt.registerTask 'default',
    "cleanup server #{tasks} watch"
