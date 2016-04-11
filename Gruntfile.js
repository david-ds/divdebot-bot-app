module.exports = function(grunt) {
	
	grunt.initConfig({
		nodemon: {
			dev: {
				script: 'index.js'
			},
			options: {
				env: {
					TELEGRAM_URL: 'https://api.telegram.org'
				}
			}
		},
		mochacli: {
			options: {
				env: {
					NODE_ENV: 'test',
					TELEGRAM_TOKEN: 'test',
					TELEGRAM_URL: 'https://api.telegram.org'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-mocha-cli');

	grunt.registerTask('serve', ['nodemon']);
	grunt.registerTask('test', ['mochacli']);
}