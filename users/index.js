var Highlight = require('./../database');

module.exports.findOrCreatePrimaryHighlight = function(user, callback) {
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


module.exports.addUserToChat = function(user, chat, callback) {
	Highlight.update({userId: user.id}, { $addToSet: {chats: chat.id}}, function(err, user) {
		if(err) { throw err;}
		callback();
	});
}