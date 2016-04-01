var request = require('request');

module.exports.getTelegramEndpoint = function () {

	var telegramToken = process.env.TELEGRAM_TOKEN || "telegram_token";
	var telegramUrl = process.env.TELEGRAM_URL || "telegram_url";

	return process.env.TELEGRAM_URL + "/bot" + process.env.TELEGRAM_TOKEN;
};


module.exports.registerToTelegram = function (TELEGRAM_ENDPOINT) {
	var myEndpoint = process.env.OPENSHIFT_APP_DNS || process.env.NGROK_URL;

	if(!myEndpoint) {
		throw ("No host url provided");
	}

	var form = {url: "https://" + myEndpoint + "/messages"};

	request.post(TELEGRAM_ENDPOINT, form, function(error, response, body) {
        if(error) { throw console.error(error);}
        console.log('successfully connected to telegram');
    });
}