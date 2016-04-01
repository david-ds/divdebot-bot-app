
/** express */
var express = require('express');
var app = express();

var bodyParser = require('body-parser');

/* request */
var request = require('express');

/** model */
var Highlight = require('./database');
/** config */
var config = require('./config');

var usersRepository = require('./users/index');


var divDeBot = function() {

	var self = this;

	/** get telegram endpoint */
	self.TELEGRAM_ENDPOINT = config.getTelegramEndpoint();


	/** register to telegram as webhook */
	//config.registerToTelegram(self.TELEGRAM_ENDPOINT);

	app.use(bodyParser.json());

	/**
	 * A new message from Telegram has comming
	 */
	app.post('/messages', function(req, res) {

		var messageResponse = {};

		if(!req.body.message) {
			return res.status(200).json({message: 'no message provided. Ignoring request'});
		}

		var incommingMessage = req.body.message;

		/* this message has a text */
		if(incommingMessage.text && incommingMessage.text !== '') {
			var text = incommingMessage.text.toLowerCase();

			var senderId = incommingMessage.from.id;
			var chat = incommingMessage.chat;

			var privateMessage = typeof incommingMessage.chat.username != "undefined";

			usersRepository.registerUserAndChannel(privateMessage, incommingMessage.from, chat, function(persistedSender) {
				/* show highlights */
				if(privateMessage && text === "/highlights") {
					Highlight.find({userId: senderId}, function(err, highlights) {
						if(err) { throw err;}

						return res.json(highlights);
					});
				}

				else if(text.indexOf("/add") === 0) {
					var highlightName = text.substring(5);

					var highlight = new Highlight({
						name: highlightName,
						userId: senderId,
						chats: persistedSender.chats
					});
					highlight.save(function() {
						return res.json({message: 'your highlight has been added'});
					});
				}

				else {
					//processing..

					return res.json({message: 'text has been processed'});
				}
			});
		}


	});

	self.run = function(callback) {
		var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
		app.listen(port, function() {
			console.log("Application listening on port %d", port);
			callback();
		});
	}
}

if(require.main === module) {
	var divDeBotApp = new divDeBot();
	divDeBotApp.run(function() {});
}

module.exports = divDeBot;





