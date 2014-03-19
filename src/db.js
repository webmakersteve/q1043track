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
	};
};


module.exports.addSong = function(data,callback) {
	x = new TrackDatabase();
	x.selectDB('q1043', function(err,db) {
		if (err) callback("NOT IMPLEMENTED", false);
		db.collection('plays', function(err,collection) {
			if (err) callback("NOT IMPLEMENTED", false);

            uuid = data.time + "-" + data.artist + "-" + data.title;
            uuid = require('crypto').createHash('md5').update(uuid).digest('hex');
            tmp = new Date(data.time);
            tmp.setHours(tmp.getHours() - 1);

            collection.findOne({name: data.title, artist: data.artist, date: {$lte: data.time, $gt: tmp.toJSON()}}, function(err, item) {

               if (item == null) {

                  collection.insert({name: data.title, artist: data.artist, date: data.time, uuid: uuid}, function(err) {
                    //if (err) require('./events').activate('error', err);
                    console.log('Writing song ' + data.title);
                    if (callback) callback(false,collection);
                });
               } else {
                   console.log('found it: '+item.name);
                   if (callback) callback(false,collection);
               }
            });

		});
	});


};
