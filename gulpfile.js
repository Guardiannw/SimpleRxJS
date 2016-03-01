var path = require('path');
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var tsConfig = {
	noImplicitAny: true,
	target: 'ES5',
	module: 'system',
	moduleResolution: 'node',
	experimentalDecorators: true,
	typescript: require('typescript')
};

gulp.task('develop', ['build'], function () {
	gulp.watch('src/**/*.*', function () {
		gulp.src('src/**/*.*')
			.pipe(sourcemaps.init())
			.pipe(ts(tsConfig))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest('dist'));
	});
});

gulp.task('build', function () {
	gulp.src('src/**/*.*')
		.pipe(sourcemaps.init())
		.pipe(ts(tsConfig))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist'));
});
