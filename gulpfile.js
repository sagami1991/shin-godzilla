var gulp = require('gulp');
var ts = require("gulp-typescript");
var tsProject = ts.createProject('tsconfig.json', {typescript: require('typescript')});

gulp.task('ts', function () {
    return gulp.src('./server/**/*.ts')
        .pipe(ts(tsProject))
        .pipe(gulp.dest('./server'));
});


gulp.task('watch', function() {  
	gulp.watch('./server/**/*.ts', ['ts']);
});

gulp.task('default', ["ts","watch"]);