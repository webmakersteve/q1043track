// JavaScript Document

var RadioReader = function() {
	this.http = require('http');
	this.db = require('./db');
	this.cache = {
		requests: [],
		songs: [],
		currentRequestResponse: ''
	};
	this.config = {
		playlistURL: "http://www.q1043.com/services/now_playing.html?streamId=1465&limit=12",
		idFormat: function(index) {return "#playlist_"+index;},
		title: ".playlist_carousel_songTitle a",
		artist: ".playlist_carousel_artistTitle a"
	};
	this.connect = function() {
		opts = this.createConnectOptions();
		var $this = this;
		req = this.http.request(opts.req, function(response) {
			chunks = [];
			response.setEncoding( 'utf8' );
			response.on('data', function(chunk) {
				chunks.push(chunk);
			});
			response.on( 'end', function() {
				//woohoo combine the chunks
				$this.cache.requests.push(chunks.join(''));
				$this.cache.currentRequestResponse = chunks.join('');
				$this.parseCurrentResponse();
			});
		});
		req.end();
	};
	this.createConnectOptions = function() {
		urlParsed = require('url').parse(this.config.playlistURL);
		port = (urlParsed.protocol == "https:") ? 443 : 80;
		return {
			req: {
				hostname: urlParsed.hostname,
				port: port,
				path: urlParsed.path,
				method: 'GET'
			}
		};
	};
	this.parseCurrentResponse = function() {

		data = JSON.parse(this.cache.currentRequestResponse);
		if (!data || !data.tracks) {
			console.log('Improperly formatted JSON');
			return;
		}
		for (x in data.tracks) {
			thisTrack = data.tracks[x].track;
			if (thisTrack && thisTrack.trackTitle && thisTrack.artistName)
				this.currentList.unshift({title: thisTrack.trackTitle, artist: thisTrack.artistName, time: new Date().toJSON()});
			else { //null track?
			}
		}
		this.end();
	};
	this.currentList = [];
	this.date = new Date();
	this.end = function() {
		//we only want to get the new songs so we will need to prune the list.
		//logic to remove differences
		filtered = this.currentList.fix(this, null);
		for (x in filtered) {
			if (filtered[x] !== undefined && filtered[x].title !== undefined) {
				this.db.addSong( filtered[x] );
                this.cache.songs.push(filtered[x]);

			}
		}

		time = this.date.getMonth() + "-" + this.date.getDay() + "-AT-" + this.date.getHours() + "_" + this.date.getMinutes();
		path = __dirname + require('path').sep + "logs" + require('path').sep + time + ".log";

		this.writeTo(path);

		//end logic
	};

	this.writeTo = function( path ) {
		var fs = require('fs');
		$this = this;

		try {
			fs.open( path, 'w', function(err,fd) {
				if (err) console.log( "Couldn't open file for writing" );
				txt = new Buffer(JSON.stringify($this.cache.songs), 'utf8');
				fs.write( fd, txt, 0, txt.length, 0, function(err, written ) {
//					console.log(written + " bytes written");
					fs.close( fd );
				});
			});
		} catch (e) {
			console.log("Couldn't write this time");
			console.log(e);
		}
	};

	return this;
};
Array.prototype.fix = function(obj) {
	var a = obj.lastList;
	if (a == null || a.length < 1) {x = this.reverse();} else {
		var titles = [];
		for (x in a) {
			if (a[x].title === null || a[x].title === undefined) {} else {titles.push(a[x].title);}
		}
		x = this.filter(function(i) {
			if (i.title === null || i.title === undefined) return false;
			if (titles.indexOf(i.title) > -1) return false; //get rid of duplicate songs
			return true;
		});
	}
	obj.lastList = obj.currentList;
	obj.currentList = [];
	return x;
};

var oldlog = console.log;
console.log = function(string) {
	date = new Date();
	time = date.getMonth() + "/" + date.getDay() + " " + date.getHours() + ":" + date.getMinutes();
	if (typeof(string) != 'object' && typeof(string) != 'array')
		oldlog( time + " --\t" + string );
	else {
		oldlog(time);
		oldlog(string);
	}
	
};
console.oldlog = oldlog;

module.exports.start = function(callback) {

	(function(x) {
		x.connect();
		setInterval( function() {
			try {
				x.connect();
			} catch (e) {
				console.log(e);
			}
		}, 120000 );
		callback(false,x);
	})(new RadioReader());

};
