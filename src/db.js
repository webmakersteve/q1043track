// JavaScript Document

var Client = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
	Errors = require('./errors');

var TrackDatabase = {
	currentClient: false,
	
	/*
	 * Causes the Mongo client to be static so we do not have too many connections.
	 * Use any time we need to get the database connection
	 */
	 
	getClient: function(callback) {
		if (this.currentClient !== false) callback(false,this.currentClient);
		else {
			this.connect(function(err,theClient) {
				callback(false,theClient);
			});
		}
	},
	
	/*
	 * Used to select a database. Works with the current client.
	 */
	 
	selectDB: function( dbname, callback ) {
		this.getClient(function(err,client) {
			db = client.db(dbname);
			if (db) callback(false,db);
			else callback("NOTIMPLEMENTED", false);
		});
	},
	
	/*
	 * Connects to the database. Do not call this method outside of the class. Please use getClient
	 * @see getClient
	 */
	
	connect: function(callback) {
		new Client(new Server('localhost', 27017)).open(function(err, theClient) {
			if (err) {callback(err,false);}
			this.currentClient = theClient;
			callback(false,theClient);
		});
	},
	
	/*
	 * Gets the song meta from the database or spotify in that order. If it is fetched from spotify it
	 * is then put in the database for caching
	 */
	
	getMeta: function(data,callback) {
		this.selectDB('q1043', function(err,db) {
			if (err) callback("NOT IMPLEMENTED", false);
			db.collection('meta', function(err,collection) {
				if (err) callback("NOT IMPLEMENTED", false);

				collection.findOne({sID: data.sID}, function(err, item) { //this gets meta
				   if (item == null) { //there is no item so we need to fetch it
					   spotify = require('./spotify'); //get spotify controller
						spotify.getMeta(data, function(err,meta) { //use it to fetch the meta
							//this gets meta from spotify
							if (err) return callback(true,false);
							//we should have the meta at this point from spotify so we need to put it in the database
							insertData = {
								sID: meta.trackSpotify,
								sAID: meta.artistSpotify,
								songLength: meta.length,
								popularity: meta.popularity
							};
							collection.insert(insertData, function(err,item) { //add it to the collection
								if (err) return callback("NOT IMPLEMENTED", false);
								return callback(false, item);
							});
							
						});
				   } else {
					   if (callback) callback(false,item);
				   }
				});

			});
		});

	},
	
	/*
	 * Gets all of the song info from the tracker data entered. Calls back and returns the songs uid
	 * and meta data
	 */
	
	getSongInfo: function(data, callback) {
		uid = data.title + " " + data.artist;
		uid = require('crypto').createHash('md5').update(uid).digest('hex');
		$ParentObject = this;
		this.selectDB('q1043', function(err,db) {
			if (err) callback("NOT IMPLEMENTED", false);
			db.collection('songs', function(err,collection) {
				if (err) callback("NOT IMPLEMENTED", false);
				collection.findOne({uid: uid}, function(err, item) {
					if (item == null) {
						//add it. This needs to be a key pair reference to some spotify id
						$ParentObject.getMeta( data, function(err,meta) { //checks if it is in the database and adds it if it is not
							if (meta)
								collection.insert({uid: uid, sID: meta.trackSpotify}, function(err,item) {
									callback(false,{uid: uid, meta: meta});
								});
							else {
								
							}
						});
				   } else {
						data.sID = item.sID;
						$ParentObject.getMeta(data, function(err, meta) {
							if (callback) return callback(false,{uid: uid, meta: meta});
						});
				   }
				});

			});
		});
	},
	
	/*
	 * Adds a play into the database. After it does this, it then gets the song data, either fetching it
	 * from the database or spotify if necessary. This is an abstracted method. This is exported
	 */ 
	
	addSong: function(data,callback) {
		$heh = this;
		this.selectDB('q1043', function(err,db) {
			if (err) callback("NOT IMPLEMENTED", false);
			db.collection('plays', function(err,collection) {
				if (err) callback("NOT IMPLEMENTED", false);
				
				//database and collection have been selected
				
				//make the uuid
				uuid = data.time + "-" + data.artist + "-" + data.title;
				uuid = require('crypto').createHash('md5').update(uuid).digest('hex');
				tmp = new Date(data.time);
				tmp.setHours(tmp.getHours() - 1);

				//conditions for finding a song in PLAYS have now been established. Make sure it wasnt PLAYED already
				
				collection.findOne({name: data.title, artist: data.artist, date: {$lte: data.time, $gt: tmp.toJSON()}}, function(err, item) {
				   if (item == null) {
						//the song was NOT PLAYED. We need to add it to the play list
					  collection.insert({name: data.title, artist: data.artist, date: data.time, uuid: uuid}, function(err) {
						//It has been added to the PLAY LIST. We need to now get the song's meta data from our database, but it might be there already
						$heh.getSongInfo(data, function(err,data) {
							//If it was there, we got it. if it wasnt there, its here now and we got it
							if (err) return callback("NOT IMPLEMENTED", false);
							if (callback) callback(false,data); //WE JUST SENT THE DATA
						});
						
					});
				   } else {
						//SONG HAS BEEN PLAYED ALREADY
						
					   console.log('found it: '+item.name);
					   $heh.getSongInfo(data, function(err,data) {
							//If it was there, we got it. if it wasnt there, its here now and we got it
							if (err) return callback("NOT IMPLEMENTED", false);
							if (callback) callback(false,data); //WE JUST SENT THE DATA
						});
				   }
				});

			});
		});
	}
	
};


module.exports.addSong = TrackDatabase.addSong(data,callback);
