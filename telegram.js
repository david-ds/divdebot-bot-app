var config = require('./config');

var request = require('request');

var telegramEndpoint = config.getTelegramEndpoint();

module.exports.sendMessage = function(notification, keyboard, callback) {

	var form = {
		chat_id: notification.to,
		text: notification.text,
		disable_notification: notification.silent
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
