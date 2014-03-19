// JavaScript Document

// JavaScript Document

var MetaFetcher = function() {
	this.http = require('http');
	this.db = require('./db');
    this.ERRORS = require('./errors');
    this.GET = {};
	this.cache = {
		requests: [],
		currentRequestResponse: ''
	};
	this.config = {
		URL: 'http://ws.spotify.com/search/1/track.json?',
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
				//woohoo combine the chunks
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
        for (x in this.GET) {
            arr.push( x+"="+encodeURIComponent(this.GET[x]) );
        }
		urlParsed = require('url').parse(url + arr.join('&') );
        console.log(url + arr.join('&'));
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
	this.parseCurrentResponse = function(callback) {

		data = JSON.parse(this.cache.currentRequestResponse);
		if (!data || !data.tracks) {
			console.log('Improperly formatted JSON');
			return;
		}

        thisTrack = data.tracks[0];
        console.log(thisTrack.name + " by " + thisTrack.artists[0].name);
        if (thisTrack && thisTrack.trackTitle && thisTrack.artistName) {

        } else { //null track?

        }
		this.end(callback);
	};
	this.end = function(callback) {
		//we only want to get the new songs so we will need to prune the list.
		//logic to remove differences
        meta = [];
		callback(false, meta);
	};
    this.get = function( data, callback ) {
        //first check if we have the meta
        $this = this;
        this.db.getMeta(data, function(err, meta) {
            if (meta) return callback(false, meta);
            $this.GET.q = data.title + " artist:" + data.artist;

            $this.connect(function(err, meta) {
                if (err) return callback(this.ERRORS.CONNECT_ERROR, false);
                else return callback(false,meta);
            });

        });

    };

	return this;
};


module.exports.getMeta = function(data, callback) {

	x = new MetaFetcher();
    x.get(data, function(err, meta) {
        if (err) return callback(x.ERRORS.SPOTIFY_ERROR, false);
        return callback(false, meta);
    });
};
