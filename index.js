
/** express */
var express = require('express');
var app = express();

var bodyParser = require('body-parser');

var uniqid = require('uniqid');
var analytics = require('./analytics');

/* request */
var request = require('express');
var async = require('async');

/** model */
var Highlight = require('./database');
/** config */
var config = require('./config');

var usersRepository = require('./users/index');
var telegram = require('./telegram');

var markdownEscape = require('markdown-escape');


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
							telegram.sendHighlights(highlights, sender, function() {
								return res.json(highlights);
							});
					});
				}
				else if(privateMessage && text.indexOf("/add -silent ") === 0) {
					var highlightName = text.substring(13);

					usersRepository.addHighlight(highlightName, persistedSender, true, function() {
						telegram.sendNewHighlight(sender, highlightName, function() {
							return res.json({message: 'your highlight has been added'});
						});

					});
				}

				else if(privateMessage && text.indexOf("/add ") === 0) {
					var highlightName = text.substring(5);

					usersRepository.addHighlight(highlightName, persistedSender, false, function() {
						telegram.sendNewHighlight(sender, highlightName
							, function() {
							return res.json({message: 'your highlight has been added'});
						});
					});
				}
				else if(privateMessage && text === "/remove")	{
					Highlight.find({userId: senderId}, function(err, highlights) {
						if(err) { throw err;}
						var keyboard = [];
						highlights.forEach(function(hl) {
							keyboard.push(["/remove " + hl.name]);
						});

						telegram.sendMessage({
							to: senderId,
							text: 'Supprimez un des highlights suivants :'
						}, {
							keyboard: keyboard,
							one_time_keyboard: true
						}, function() {
							return res.json({message: 'keyboard shown'});
						});

					});

				}
				else if(privateMessage && text.indexOf("/remove ") === 0) {
					var highlightName = text.substring(8);

					usersRepository.removeHighlight(highlightName, persistedSender, function() {
						telegram.sendRemovedHighlight(sender, highlightName, function() {
							return res.json({message: 'Your highlight has been removed'});
						})
					});
				}

				else if(privateMessage && text.indexOf("/mute ") === 0) {
					var username = text.substring(6);

					if (username.indexOf("@") === 0)
					{
						username = username.substring(1);
					}

					Highlight.update({userId: senderId}, { $addToSet: {muted: username}}, {multi: true}, function() {
						return res.json({message: '@' + username + ' has been muted'});
					});
				}
				else if(privateMessage && text.indexOf("/unmute ") === 0) {
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

					//registering it..
					analytics.incrementChat(chat);

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
										var hashtag = telegramResponse.hashtag;

                		async.each(notifications, function(notification, callback) {
                			telegram.sendMessage(notification, {}, function(options, body) {
                				callback();
                			});
                		}, function() {
											if(sendHashtag) {
												telegram.sendMessage({
													to: chat.id,
													text: "#" + hashtag
												}, {}, function() {

													telegram.sendIsTyping(chat);

													return res.json({message: 'highlights found : ' + hls.length, highlights: notifications, sendHashtag: sendHashtag});
												})
											} else {
												return res.json({message: 'highlights found : ' + hls.length, highlights: notifications, sendHashtag: sendHashtag});
											}
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
		var hashtag = uniqid();

		hls.forEach(function(hl) {
			if(targetsId.indexOf(hl.userId) === -1)
			{
				var text = '*' + markdownEscape(sender.first_name + ' ' + sender.last_name.substr(0,1)) + '*' + markdownEscape(' a parlé de ' + hl.name + ' dans ' + chat.title) + '\n';
				text += '\n';
				text += markdownEscape(originalText);

				var showTrace = ((words_at.indexOf("@" + hl.name) > -1) || hl.primary) && !hl.silent;
				if(showTrace) {
					text += '\n';
					text += "#" + hashtag;
				}

				notifications.push({
					to: hl.userId,
					silent: hl.silent,
					showTrace: showTrace,
					text: text,
					parse_mode: 'Markdown'
				});

				sendHashtag = sendHashtag || showTrace;

				targetsId.push(hl.userId);
			}
		});

		return {notifications: notifications, sendHashtag: sendHashtag, hashtag: hashtag};
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
