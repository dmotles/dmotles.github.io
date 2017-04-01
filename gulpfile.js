var gulp = require('gulp');
var closureCompiler = require('google-closure-compiler').gulp();
var concat = require('gulp-concat');
var webserver = require('gulp-webserver');

var comment = '/* copyright (c) 2017 Daniel Motles. All Rights Reserved. */\n';

gulp.task('watch', function() {
    return gulp.watch(['./src/**/*.js'], ['concat', 'js-compile']);
});

gulp.task('server', function() {
    return gulp.src('./')
      .pipe(webserver({
          livereload: true,
          directoryListing: false,
          fallback: 'index.html'
      }));
});

gulp.task('copy-vendor', function() {
    return gulp.src([
        './node_modules/three/build/three*',
        './node_modules/underscore/underscore*'
    ])
    .pipe(gulp.dest('./js'));
});


gulp.task('concat', function() {
    return gulp.src(['./src/js/**/*.js'], {base: './'})
    .pipe(concat('dmapp.js'))
    .pipe(gulp.dest('./js'));
});

gulp.task('js-compile', function() {
     return gulp.src(['./src/js/**/*.js'], {base: './'})
     .pipe(closureCompiler({
         compilation_level: 'SIMPLE',
         warning_level: 'DEFAULT',
         language_in: 'ECMASCRIPT5_STRICT',
         language_out: 'ECMASCRIPT5_STRICT',
         output_wrapper: comment + '(function(){\n%output%\n}).call(this)',
         js_output_file: 'dmapp.min.js'
     }))
     .pipe(gulp.dest('./js'));
});

gulp.task('default', ['concat', 'copy-vendor', 'js-compile']);
