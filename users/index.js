var Highlight = require('./../database');


var findOrCreatePrimaryHighlight = function(user, callback) {
	var newUser = new Highlight({
		name: user.username,
		userId: user.id,
		primary: true
	});

	Highlight.findOneOrCreate({userId: user.id}, newUser, function(err, user) {
		if(err) { throw err;}

		callback(user);
	});
};

var addUserToChat = function(user, chat, callback) {
	Highlight.update({userId: user.id}, { $addToSet: {chats: chat.id}}, function(err, user) {
		if(err) { throw err;}
		callback();
	});
};

var registerUserAndChannel = function(privateMessage, sender, chat, callback) {
	/* register sender if he is not in the database */
	findOrCreatePrimaryHighlight(sender, function(persistedSender) {

		if(!privateMessage) {
			/* add the user to the current chat if not */
			addUserToChat(sender, chat, function() {
				if(!privateMessage) {
					callback(persistedSender);
				}
			});
		}
		else {
			callback(persistedSender);
		}

	});
};

var addHighlight = function(highlight, persistedSender, silent, callback) {
	var highlight = new Highlight({
		name: highlight,
		userId: persistedSender.userId,
		chats: persistedSender.chats,
		muted: persistedSender.muted,
		silent: silent
	});

	highlight.save(callback);
}

var removeHighlight = function(highlight, persistedSender, callback) {
	Highlight.remove({userId: persistedSender.userId, name: highlight}, callback);
}

module.exports.findOrCreatePrimaryHighlight = findOrCreatePrimaryHighlight;
module.exports.addUserToChat = addUserToChat;
module.exports.registerUserAndChannel = registerUserAndChannel;
module.exports.addHighlight = addHighlight;
module.exports.removeHighlight = removeHighlight;
