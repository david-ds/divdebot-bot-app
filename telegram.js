var config = require('./config');

var request = require('request');

var telegramEndpoint = config.getTelegramEndpoint();

var sendMessage = function(notification, keyboard, callback) {

	var form = {
		chat_id: notification.to,
		text: notification.text,
		disable_notification: notification.silent || false
	};

	var options = {
		method: 'post',
		url: telegramEndpoint + '/sendMessage',
		form: form
	};
	if(process.env.NODE_ENV != "test"){
		request.post(telegramEndpoint + '/sendMessage', {form: form, json: true}, function(err, res, body) {
			if(err) { throw err;};
			callback(options, body);
		});
	}
	else {
		callback(options, {});
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
	}, {}, callback);
};

module.exports.sendNewHighlight = function(sender, highlightName, callback) {
	sendMessage({to: sender.id, text: highlightName + " a été ajouté à la liste de tes /highlights"}, {}, callback);
};

module.exports.sendRemovedHighlight = function(sender, highlightName, callback) {
	sendMessage({to: sender.id, text: highlightName + " a été supprimé de la liste de tes /highlights"}, {}, callback);
}
