module.exports = function(grunt) {
	
	grunt.initConfig({
		nodemon: {
			dev: {
				script: 'index.js'
			},
			options: {
				env: {
					TELEGRAM_TOKEN: 'test',
					TELEGRAM_URL: 'https://api.telegram.org'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-nodemon');

	grunt.registerTask('serve', ['nodemon'])
}