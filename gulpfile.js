var gulp = require('gulp');
var merge = require('merge2');
var ts = require('gulp-typescript');
var jasmine = require('gulp-jasmine');
var rename = require("gulp-rename");
var clean = require('gulp-clean');

var releaseDir = '_package';
var specReleaseDir = '_spec-release';
var tsConfigPath = 'tsconfig.json';

gulp.task('default', ['cleanDst', 'compileSrc', 'runTests', 'copyOtherPackageFilesToRelease']);

gulp.task('cleanDst', function () {
    return gulp.src([releaseDir, specReleaseDir], { read: false }).pipe(clean());
});

gulp.task('compileSrc', ['cleanDst'], function () {
    var tsProject = ts.createProject(tsConfigPath);
    var tsResult = tsProject.src().pipe(tsProject());
    return merge([
        tsResult.dts.pipe(gulp.dest(releaseDir)),
        tsResult.js
            .pipe(gulp.dest(releaseDir))
            .pipe(gulp.dest(specReleaseDir))
    ]);
});

gulp.task('runTests', ['compileSrc'], function () {
    return gulp.src(specReleaseDir + '/spec/**/*.spec.js')
        .pipe(jasmine({
            verbose: true,
            includeStackTrace: false
        }));
});

gulp.task('copyOtherPackageFilesToRelease', ['compileSrc'], function () {
    return merge([
        gulp.src('./package.json').pipe(gulp.dest(releaseDir)),
        gulp.src('./npmignore.res')
            .pipe(rename('.npmignore'))
            .pipe(gulp.dest(releaseDir)),
        gulp.src('./LICENSE').pipe(gulp.dest(releaseDir)),
        gulp.src('./README.md').pipe(gulp.dest(releaseDir))
    ]);
});