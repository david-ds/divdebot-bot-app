var config = require('./config');

var request = require('request');

var telegramEndpoint = config.getTelegramEndpoint();


var keyboard = [
	["/help"],
	["/highlights"],
	["/add", "/add -silent"],
	["/remove"]
];

var sendMessage = function(notification, keyboard, callback) {

	var form = {
		chat_id: notification.to,
		text: notification.text,
		disable_notification: notification.silent || false,
		parse_mode: notification.parse_mode
	};

	if(keyboard) {
		form.reply_markup = JSON.stringify(keyboard);
	}


	var options = {
		method: 'post',
		url: telegramEndpoint + '/sendMessage',
		form: form
	};
	if(process.env.NODE_ENV != "test") {
		request.post(telegramEndpoint + '/sendMessage', {form: form, json: true}, function(err, res, body) {
			if(err) { throw err;};
			callback(options, body);
		});
	}
};

module.exports.sendMessage = sendMessage;

module.exports.sendHighlights = function(highlights, sender, callback) {
	var text = "Mes highlights :\n\n";
	highlights.forEach(function(hl) {
		text += hl.name;
		if(hl.silent) {
			text += " [silencieux]";
		}
		text += "\n";
	});

	sendMessage({
		to: sender.id,
		text: text
	}, {keyboard: keyboard}, callback);
};

module.exports.sendNewHighlight = function(sender, highlightName, callback) {
	sendMessage({to: sender.id, text: highlightName + " a été ajouté à la liste de tes /highlights"}, {keyboard: keyboard}, callback);
};

module.exports.sendRemovedHighlight = function(sender, highlightName, callback) {
	sendMessage({to: sender.id, text: highlightName + " a été supprimé de la liste de tes /highlights"}, {keyboard:keyboard}, callback);
}

module.exports.sendIsTyping = function(chat) {
	request.post(telegramEndpoint + "/sendChatAction",
	{
		form: {
			chat_id: chat.id,
			action: "typing"
		},
		json: true,
	}, function(err, res, body) {
		if(err) { throw err;}
	});
};
