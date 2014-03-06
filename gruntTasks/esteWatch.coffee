module.exports = ->
  options:
    dirs: ['.', 'views/**/']
    livereload:
      enabled: true
      extensions: ['coffee', 'sass', 'js', 'css', 'jade']
      port: 35729
