
/** express */
var express = require('express');
var app = express();

var bodyParser = require('body-parser');

/* request */
var request = require('express');
var async = require('async');

/** model */
var Highlight = require('./database');
/** config */
var config = require('./config');

var usersRepository = require('./users/index');
var telegram = require('./telegram');


var divDeBot = function() {

	var self = this;

	/** get telegram endpoint */
	self.TELEGRAM_ENDPOINT = config.getTelegramEndpoint();


	/** register to telegram as webhook */
	if(process.env.NODE_ENV != "test") {
		config.registerToTelegram(self.TELEGRAM_ENDPOINT);
	}

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

			var sender = incommingMessage.from;
			var senderId = sender.id;
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

				else if(privateMessage && text.indexOf("/add --slient") === 0) {
					var highlightName = text.substring(14);

					return usersRepository.addHighlight(highlightName, persistedSender, true, res);
				}

				else if(privateMessage && text.indexOf("/add") === 0) {
					var highlightName = text.substring(5);

					return usersRepository.addHighlight(highlightName, persistedSender, false, res);
				}

				else if(privateMessage && text.indexOf("/mute") === 0) {
					var username = text.substring(6);

					if (username.indexOf("@") === 0)
					{
						username = username.substring(1);
					}

					Highlight.update({userId: senderId}, { $addToSet: {muted: username}}, {multi: true}, function() {
						return res.json({message: '@' + username + ' has been muted'});
					});
				}
				else if(privateMessage && text.indexOf("/unmute") === 0) {
					var username = text.substring(8);

					if (username.indexOf("@") === 0)
					{
						username = username.substring(1);
					}

					Highlight.update({userId: senderId}, {$pull: {muted: username}}, {multi: true}, function() {
						return res.json({message: '@' + username + ' has been unmuted'});
					})
				}

				else if(!privateMessage) {
					//text processing..

					var words = text.match(/\b([\w\déèêaàâïîôöùûü_\-\']+)\b/g);
                	var words_at = text.match(/\@([\w\déèêaàâïîôöùûü_\-\']+)\b/g) || []; //words with @blabla

                	if(!words) {
                		return res.json({message: 'empty text'});
                	}


                	console.log('parsing message ' + text);


                	Highlight.find({
                		name: {$in: words},
                		//userId: {$ne: senderId},
                		chats: chat.id,
                		muted: {$ne: sender.username}
                	}, function(err, hls) {
                		if(err) { throw err;}
                		if(!hls) {
                			return res.json({message: 'no highlight found'});
                		}


                		var telegramResponse = self.highlightsAnalysis(hls, sender, chat, incommingMessage.text, words_at);

                		var notifications = telegramResponse.notifications;
                		var sendHashtag = telegramResponse.sendHashtag;

                		async.each(notifications, function(notification, callback) {
                			telegram.sendMessage(notification, {}, function(options, body) {
                				callback();
                			});
                		}, function() {
               				return res.json({message: 'highlights found : ' + hls.length, highlights: notifications, sendHashtag: sendHashtag});

                		});


                	});


				}
				else {
					return res.json({message: 'incorrect command'});
				}
			});
		}
	});

	self.highlightsAnalysis = function(hls, sender, chat, originalText, words_at) {
		var notifications = [];
		var targetsId = [];
		var sendHashtag = false;

		hls.forEach(function(hl) {
			if(targetsId.indexOf(hl.userId) === -1)
			{
				var text = sender.first_name + ' ' + sender.last_name.substr(0,1) + ' a parlé de ' + hl.name + ' dans ' + chat.title + '\n';
				text += '\n';
				text += originalText;

				var showTrace = ((words_at.indexOf("@" + hl.name) > -1) || hl.primary) && !hl.silent;
				if(showTrace) {
					text += '\n';
					text += "#blabla";
				}

				notifications.push({
					to: hl.userId,
					silent: hl.silent,
					showTrace: showTrace,
					text: text
				});

				sendHashtag = sendHashtag || showTrace;

				targetsId.push(hl.userId);
			}
		});

		return {notifications: notifications, sendHashtag: sendHashtag};
	}

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
