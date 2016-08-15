const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const dateFormat = require('dateformat');

module.exports = {
  entry: ["./src/app.ts"],
  output: {
	path:"./dist",
    filename: "bundle.js",
  },
//   devtool: "source-map",
  resolve: {
    extensions: ["", ".ts", ".js"],
	alias: {
       handlebars: 'handlebars/dist/handlebars.min.js'
    }
  },

  module: {
    loaders: [
		{ test: /\.ts?$/, loader: "ts-loader" },
		{ test: /\.html$/, loader: 'raw'},
		{ test: /\.scss$/, loaders: ['style', 'css', 'sass'] },
		{ test: /\.png$/, loader: "url?limit=10000&mimetype=image/png" },
		{ test: /\.jpg$/, loader: "url?limit=10000&mimetype=image/jpeg" },
    ]
  },
  	plugins: [
	// 	new UglifyJsPlugin({
    //   beautify: false, //prod
    //   mangle: { screw_ie8 : true }, //prod
    //   compress: { screw_ie8: true }, //prod
    //   comments: false //prod
	// 	}),
		new CopyWebpackPlugin([
			{ from: 'src/index.html', to: 'index.html' },
			{ from: 'src/assets', to: 'assets' },
		]),
		new DefinePlugin({
			LAST_UPDATED: `"${dateFormat(new Date(),"yyyy/mm/dd HH:MM")}"`,
		}),
	],
};