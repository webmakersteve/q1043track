// JavaScript Document

var Client = require('mongodb').MongoClient,
    Server = require('mongodb').Server;

var TrackDatabase = function() {
	this.client = new Client(new Server('localhost', 27017));
	this.currentClient = false;
	this.getClient = function(callback) {
		if (this.currentClient !== false) callback(false,this.currentClient);
		else {
			this.connect(function(err,theClient) {
				callback(false,theClient);
			});
		}
	};
	this.selectDB = function( dbname, callback ) {
		this.getClient(function(err,client) {
			db = client.db(dbname);
			if (db) callback(false,db);
			else callback("NOTIMPLEMENTED", false);
		});
	};
	this.connect = function(callback) {
		this.client.open(function(err, theClient) {
			if (err) {callback(err,false);}
			this.currentClient = theClient;
			callback(false,theClient);
		});
	}
}


module.exports.addSong = function(data) {
	x = new TrackDatabase();
	x.selectDB('q1043', function(err,db) {
		if (err) return false;
		db.collection('plays', function(err,collection) {
			songs = collection.find().toArray(function(err,s) {
				if (err) console.log(err);
				for (x in s) console.log(s[x]);

			});
			if (err) return false;
			collection.insert({name: data.title}, function(err) {
				//if (err) require('./events').activate('error', err);
				console.log('Writing song ' + data.title);
			});
		});
	});


}
