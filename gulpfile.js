var gulp = require('gulp');
var merge = require('merge2');
var ts = require('gulp-typescript');
var jasmine = require('gulp-jasmine');
var exec = require('child_process').exec

var releaseDir = 'release';
var specsDir = 'spec-release';
var tsConfigPath = 'tsconfig.json';

gulp.task('default', ['compileSrc', 'test']);

gulp.task('compileSrc', function (cb) {
    var tsProject = ts.createProject(tsConfigPath);
    var tsResult = tsProject.src().pipe(ts(tsProject));
    return merge([
        tsResult.dts
            .pipe(gulp.dest(releaseDir)),
        tsResult.js
            .pipe(gulp.dest(releaseDir))
            .pipe(gulp.dest(specsDir))
    ]);
});

gulp.task('test', ['copyJasmineCore'], function (cb) {
    return gulp.src(specsDir + '/spec/**/*.spec.js')
        .pipe(jasmine({
            verbose: true,
            includeStackTrace: false
        }));
});

gulp.task('copyJasmineCore', function () {
    return gulp.src('node_modules/jasmine-core/lib/jasmine-core/**/*')
        .pipe(gulp.dest(specsDir + '/jasmine-core'));
});
