let preprocessor = 'sass'; // Preprocessor (sass, sass, less, styl)
let fileswatch   = 'html,htm,txt,json,md,woff2'; // List of files extensions for watching & hard reload (comma separated)

const { src, dest, parallel, series, watch, lastRun } = require('gulp');
const scss         = require('gulp-sass');
const cleancss     = require('gulp-clean-css');
const concat       = require('gulp-concat');
const browserSync  = require('browser-sync').create();
const uglify       = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const babel        = require('gulp-babel');
const newer        = require('gulp-newer');
const rsync        = require('gulp-rsync');
const del          = require('del');

// Local Server

function browsersync() {
	browserSync.init({
		server: { baseDir: 'app' },
		notify: false,
		// online: false, // Work offline without internet connection
	})
}

// Custom Styles

function styles() {
	return src('app/sass/main.*')
		.pipe(scss())
		.pipe(concat('main.min.css'))
		.pipe(autoprefixer({ overrideBrowserslist: ['last 15 versions'], grid: true }))
		.pipe(cleancss( {level: { 1: { specialComments: 0 } } }))
		.pipe(dest('app/css'))
		.pipe(browserSync.stream())
}

// Scripts & JS Libraries

function scripts() {
	return src([
		// 'node_modules/jquery/dist/jquery.min.js', // npm vendor example (npm i --save-dev jquery)
		'app/js/common.js' // common.js. Always at the end
	])
		.pipe(concat('scripts.min.js'))
		.pipe(babel({
			presets: ['@babel/env'],
			plugins: ['@babel/plugin-syntax-import-meta'],
		}))
		//.pipe(uglify()) // Minify JS (opt.)
		.pipe(dest('app/js'))
		.pipe(browserSync.stream())
}

// Watching

function startwatch() {
	watch('app/' + preprocessor + '/**/*', styles);
	watch(['app/**/*.js', '!app/js/*.min.js'], scripts);
	watch(['app/**/*.{' + fileswatch + '}']).on('change', browserSync.reload);
}

exports.browsersync = browsersync;
exports.assets      = series(styles, scripts);
exports.styles      = styles;
exports.scripts     = scripts;
exports.default     = parallel(styles, scripts, browsersync, startwatch);