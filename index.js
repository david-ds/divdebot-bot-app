
/** express */
var express = require('express');
var app = express();

var bodyParser = require('body-parser');

/* request */
var request = require('express');

/** model */
var Highlight = require('./database')();

var config = require('./config');


var divDeBot = function() {

	var self = this;

	/** get telegram endpoint */
	self.TELEGRAM_ENDPOINT = config.getTelegramEndpoint();


	/** register to telegram as webhook */
	//config.registerToTelegram(self.TELEGRAM_ENDPOINT);

	app.use(bodyParser.json());

	/* main endpoint */
	app.get('/messages', function(req, res) {



	});

	self.run = function() {
		var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
		app.listen(port, function() {
			console.log("Application listening on port %d", port)
		});
	}
}

var divDeBotApp = new divDeBot();
divDeBotApp.run();





