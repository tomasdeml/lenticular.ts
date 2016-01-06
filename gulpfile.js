var gulp = require('gulp');
var merge = require('merge2');
var ts = require('gulp-typescript');
var jasmine = require('gulp-jasmine');
var rename = require("gulp-rename");

var releaseDir = '_package';
var specReleaseDir = '_spec-release';
var tsConfigPath = 'tsconfig.json';

gulp.task('default', ['compileSrc', 'runTests', 'copyOtherPackageFilesToRelease']);

gulp.task('compileSrc', function (cb) {
    var tsProject = ts.createProject(tsConfigPath);
    var tsResult = tsProject.src().pipe(ts(tsProject));
    return merge([
        tsResult.dts
            .pipe(gulp.dest(releaseDir)),
        tsResult.js
            .pipe(gulp.dest(releaseDir))
            .pipe(gulp.dest(specReleaseDir))
    ]);
});

gulp.task('runTests', ['copyJasmineCore'], function (cb) {
    return gulp.src(specReleaseDir + '/spec/**/*.spec.js')
        .pipe(jasmine({
            verbose: true,
            includeStackTrace: false
        }));
});

gulp.task('copyJasmineCore', function () {
    return gulp.src('node_modules/jasmine-core/lib/jasmine-core/**/*')
        .pipe(gulp.dest(specReleaseDir + '/jasmine-core'));
});

gulp.task('copyOtherPackageFilesToRelease', function (cb) {
    return merge([
        gulp.src('./package.json').pipe(gulp.dest(releaseDir)),
        gulp.src('./npmignore.res')
            .pipe(rename('.npmignore'))
            .pipe(gulp.dest(releaseDir)),
        gulp.src('./LICENSE').pipe(gulp.dest(releaseDir)),
        gulp.src('./README.md').pipe(gulp.dest(releaseDir))
    ]);
});
