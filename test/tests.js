var supertest = require('supertest');
var assert = require('assert');

var agent = supertest.agent('http://localhost:8080');

var highlight = require('./../database');

var server = require('./../index.js');

var createMessage = function(text, chat) {
	var message = 
	{
		message: {
			from: {
				id: 12345,
				username: 'div',
				first_name: 'David',
				last_name: 'Dos Santos'
			},
			
			text: text
		}
	};

	if(typeof chat != "undefined")
	{
		message.message.chat = {id: chat}
	} else {
		message.message.chat =  {
			username: 'div',
			first_name: 'David',
			last_name: 'Dos Santos'
		};
	}

	return message;
}

describe("Recieve message from telegram", function() {

	before(function(done) {


		highlight.remove({}, done);
	});

	before(function(done) {
		var app = new server();
		app.run(done);
	});

	describe("Registration", function() {
		it("should recieve the first message", function(done) {
			var registeredMessage = createMessage('coucou', 9876);

			agent.post('/messages').send(registeredMessage).expect(200).end(function(err, res) {
				done();
			});
		});

		it("should have registered me", function(done) {
			highlight.find({}, function(err, highlights) {
				assert.equal(highlights.length, 1, highlights.length + ' found');
				done();
			});
		});

		it("should not register me twice", function(done) {
			var registeredMessage = createMessage('coucou bis', 9876);

			agent.post('/messages').send(registeredMessage).expect(200).end(function(err, res) {
				highlight.find({}, function(err, highlights) {
					assert.strictEqual(highlights.length, 1, highlights.length + " highlights found instead of one");
					done();
				})
			});
		});
	});

	describe("Send a message to another channel", function() {
		it("should recieve message", function(done) {
			var registeredMessage = createMessage('coucou tierce', 9875);

			agent.post('/messages').send(registeredMessage).expect(200).end(function(err, res) {
				done();
			});
		});

		it("should have registered the other channel", function(done) {
			highlight.find({}, function(err, highlights) {
				assert.strictEqual(highlights.length, 1, highlights.length + " highlights found instead of one");
				assert.strictEqual(highlights[0].chats.length, 2, "Chats found : " + highlights[0].chats);
				done();
			});
		});
	});
});

describe("Send a command", function() {
	describe("Register an normal highlight", function() {
		it("should recieve message", function(done) {
			var registerMessage = createMessage('/add divounet');

			agent.post('/messages').send(registerMessage).expect(200).end(function(err, res) {
				done();
			})
		});

		it("should have 2 highlights registered", function(done) {
			highlight.find({}, function(err, highlights) {
				assert.strictEqual(highlights.length, 2, highlights.length + ' highlights found');
				done();
			});
		});

		it("should have the same registered channels", function(done) {
			highlight.find({'chats': [9876, 9875]}, function(err, highlights) {
				assert.strictEqual(highlights.length, 2, "not the same registered channels");
				done();
			});
		});
	})


	describe("Want /highlights", function() {
		it("should send all higlights", function(done) {
			var registeredMessage = createMessage('/highlights');
			agent.post('/messages').send(registeredMessage).expect(200).end(function(err, res) {
				assert.strictEqual(res.body.length, 2, res.body.length + ' highlights sent');
				done();
			});
		});
	});


	describe("Mute someone", function() {
		it("should recieve message", function(done) {
			var registeredMessage = createMessage('/mute @cococo');
			agent.post('/messages').send(registeredMessage).expect(200).end(function(err, res) {
				assert.equal(res.body.message, '@cococo has been muted', 'user not muted');
				done();
			});
		})
		it("coco should be muted", function(done) {
			highlight.findOne({primary: true}, function(err, hl) {
				assert.deepEqual(hl.muted, ['cococo'], 'coco is not muted : ' + hl.muted);
				done();
			});
		});
		it("should mute someone else", function(done) {
			var registeredMessage = createMessage('/mute @lizzaroc');
			agent.post('/messages').send(registeredMessage).expect(200).end(function(err, res) {
				highlight.findOne({primary: true}, function(err, hl) {
					assert.deepEqual(hl.muted, ['cococo', 'lizzaroc'], 'coco or lizzaroc are not muted');
					done();
				})
			});
		});
	});


	describe("Unmute someone", function() {
		it("should unmute cococo", function(done) {
			var registeredMessage = createMessage('/unmute @cococo');
			agent.post('/messages').send(registeredMessage).expect(200).end(function(err, res) {
				assert.equal(res.body.message, '@cococo has been unmuted');
				done();
			});
		});
		it("Only lizzaroc should be muted", function(done) {
			highlight.findOne({primary: true}, function(err, hl) {
				assert.deepEqual(hl.muted, ['lizzaroc'], 'muted users');
				done();
			});
		});
	});

	describe("send incorrect command", function() {
		it("should say incorrect command", function(done) {
			var registeredMessage = createMessage('incorrect command');
			agent.post('/messages').send(registeredMessage).expect(200).end(function(err, res) {
				assert.equal(res.body.message, 'incorrect command');
				done();
			});
		});
	});
});

