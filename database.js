var mongoose = require('mongoose');

var findOneOrCreate = require('mongoose-find-one-or-create');


function databaseConnection() {
	var options = {
		host : process.env.OPENSHIFT_MONGODB_DB_HOST || "localhost",
		port : process.env.OPENSHIFT_MONGODB_DB_PORT || 27017,
		username : process.env.OPENSHIFT_MONGODB_DB_USERNAME,
		password : process.env.OPENSHIFT_MONGODB_DB_PASSWORD,
		db: process.env.OPENSHIFT_APP_NAME || "div"
	};

	var connection_url = options.host + ":" + options.port + "/" + options.db;

	if(options.username)
	{
		connection_url = options.username + ":" + options.password + "@" + connection_url
	}

	connection_url = "mongodb://" + connection_url;

	mongoose.connect(connection_url);
}



	
databaseConnection();

var highlightSchema = mongoose.Schema({
	name: String,
	userId: Number,
	chats: [Number],
	muted: [Number], /* muted users */
	silent: {type: Boolean, default: false}, /* if not noisy, send a discrete notification */
	primary: {type: Boolean, default: false}
});

highlightSchema.plugin(findOneOrCreate);

module.exports = mongoose.model('Highlight', highlightSchema);
