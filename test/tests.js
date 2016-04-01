var supertest = require('supertest');
var assert = require('assert');

var agent = supertest.agent('http://localhost:8080');

var highlight = require('./../database');

var server = require('./../index.js');


describe("Recieve message from telegram", function() {

	before(function(done) {


		highlight.remove({}, done);
	});

	before(function(done) {
		var app = new server();
		app.run(done);
	});

	describe("Send messages to a channel", function() {
		it("should recieve the first message", function(done) {
			var registeredMessage = {
				message: {
					from: {
						id: 12345,
						username: 'test'
					},
					chat: {
						id: 9776
					},
					text: 'coucou test'
				}
			};

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
			var registeredMessage = {
				message: {
					from: {
						id: 12345,
						username: 'test'
					},
					chat: {
						id: 9776
					},
					text: 'coucou hello'
				}
			};

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
			var registeredMessage = {
				message: {
					from: {
						id: 12345,
						username: 'test'
					},
					chat: {
						id: 9779
					},
					text: 'coucou hello'
				}
			};

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

