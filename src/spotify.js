// JavaScript Document

// JavaScript Document

MetaFetcher = function() {
	this.http = require('http');
	this.db = require('./db');
    this.ERRORS = require('./errors').errors;
	this.cache = {
		requests: [],
		currentRequestResponse: ''
	};
	this.config = {
		URL: 'http://ws.spotify.com/search/1/track.json?',
		Requested: null,
		get: []
	};
	this.connect = function(callback) {
		opts = this.createConnectOptions();
		var $this = this;
		req = this.http.request(opts.req, function(response) {
			chunks = [];
			response.setEncoding( 'utf8' );
			response.on('data', function(chunk) {
				chunks.push(chunk);
			});
			response.on( 'end', function() {
				$this.cache.requests.push(chunks.join(''));
				$this.cache.currentRequestResponse = chunks.join('');
				$this.parseCurrentResponse(callback);
			});
		});
		req.end();
	};
	this.createConnectOptions = function() {
        url = this.config.URL;
        arr = [];
        for (x in this.config.get) {
			if (typeof(this.config.get[x]) == 'string')
				arr.push( x+"="+encodeURIComponent(this.config.get[x]) );
        }
		this.config.Requested = url + arr.join('&');
		urlParsed = require('url').parse(this.config.Requested);
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
	this.meta = false;
	this.parseCurrentResponse = function(callback) {
		try {
			data = JSON.parse(this.cache.currentRequestResponse);
			
			if (!data || !data.tracks) {
				callback('Improperly formatted JSON', false);
				return;
			}

			thisTrack = data.tracks[0];
			console.log('Spotify found ' + thisTrack.name);
			if (thisTrack && thisTrack.name && thisTrack.artists[0]) {
				this.meta = {
					length: thisTrack.length,
					artistSpotify: thisTrack.artists[0].href,
					popularity: thisTrack.popularity,
					trackSpotify: thisTrack.href};
			} else { //null track?
				this.meta = false;
			}
			if (callback) callback(false, this.meta);
		} catch (e) {
			if (callback) callback(true,false);
		}
	};
    this.get = function( data, callback ) {
        //first check if we have the meta
        $this = this;
		this.config.data = data;        
		
		this.connect(function(err, meta) {
			if (err) return callback($this.ERRORS.CONNECT_ERROR, false);
			else {
				return callback(false,meta);
			}
		});

        

    };

	return this;
};


module.exports.getMeta = function(data, callback) {
	
    new MetaFetcher().get(data, function(err, meta) {
        if (err) return callback(MetaFetcher().ERRORS.SPOTIFY_ERROR, false);
		
        return callback(false, meta);
    });
};
