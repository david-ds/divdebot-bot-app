var redis = require('redis');

var url = "redis://";
url += process.env.REDIS_DB_USER || "";
if(process.env.REDIS_DB_PASSWORD) {
  url += ":" + process.env.REDIS_DB_PASSWORD + "@";
}
url += process.env.REDIS_DB_HOST || "127.0.0.1";
url += ":" + (process.env.REDIS_DB_PORT || "6379");

var client = redis.createClient({url: url});


module.exports = {
  incrementChat: function(chat) {
    client.sadd("chans", chat.id);
    client.incr("chat_" + chat.id);
  }
};
