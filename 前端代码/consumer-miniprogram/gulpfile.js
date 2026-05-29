const gulp = require('gulp');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const { createPlugins } = require('weapp-tailwindcss/gulp');
const { transformWxss, transformWxml, transformJs } = createPlugins();

const src = './src';
const dist = './dist';


gulp.task('css', () => {
  return gulp.src(`${src}/**/*.wxss`)
    .pipe(postcss())
    .pipe(transformWxss())
    .pipe(gulp.dest(dist));
});

// 处理 WXML
gulp.task('wxml', () => {
  return gulp.src(`${src}/**/*.wxml`)
    .pipe(transformWxml())
    .pipe(gulp.dest(dist));
});

// 处理 JS
gulp.task('js', () => {
  return gulp.src(`${src}/**/*.js`)
    .pipe(gulp.dest(dist));
});

// 拷贝配置等文本文件
gulp.task('copy-static', () => {
  return gulp.src([
    `${src}/**/*.json`,
    `${src}/**/*.wxs`,
    `!${src}/**/*.md`
  ]).pipe(gulp.dest(dist));
});

// Gulp 5 默认按文本读取文件，图片等二进制资源需要显式关闭编码。
gulp.task('copy-assets', () => {
  return gulp.src(`${src}/**/*.{png,jpg,jpeg,gif,svg,webp}`, { encoding: false })
    .pipe(gulp.dest(dist));
});

gulp.task('copy', gulp.parallel('copy-static', 'copy-assets'));

// 监听文件变化
gulp.task('watch', () => {
  gulp.watch(`${src}/**/*.wxss`, gulp.series('css'));
  gulp.watch(`${src}/**/*.wxml`, gulp.series('wxml', 'css'));
  gulp.watch(`${src}/**/*.js`, gulp.series('js', 'css'));
  gulp.watch([
    `${src}/**/*.json`,
    `${src}/**/*.wxs`,
    `${src}/**/*.{png,jpg,jpeg,gif,svg,webp}`
  ], gulp.series('copy'));
});

// 构建任务（不监听）
gulp.task('build', gulp.parallel('css', 'wxml', 'js', 'copy'));

// 默认任务
gulp.task('default', gulp.series(
  'build',
  'watch'
));
