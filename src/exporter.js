// JavaScript Document

var getArgs = function() {

	returns = {file: false};

	process.argv.forEach(function (val, index, array) {
	  if (index == 2) returns.file = val;
	});
	return returns;
}

var go = function() {

	fs = require('fs');
	path = __dirname + require('path').sep + ((getArgs().file) ? getArgs().file : "log-2-1-AT-14_13.log");
	c = fs.readFile(path, function(err, data) {
		if (err) console.log(err);
		else console.log('found it');
		d = JSON.parse(data.toString());
		console.log(d.length + " total songs");
		console.log((d.length - 9) + " total songs since start");

		lowestDate = new Date();
		highestDate = false;

		for (x in d) {
			t = d[x];
			date = new Date(t.time);
			//we need to find the lowest one
			if (date.getTime() < lowestDate) lowestDate = date.getTime();
			if (highestDate == false || date.getTime() > highestDate) highestDate = date.getTime();
			dateString = (date.getMonth()+1) + "/" + date.getDate() + " around " + date.getHours() + ":" + date.getMinutes();
			console.log(t.title + " played at " + dateString);
		}

		length = highestDate - lowestDate;
		lenHours = (length / (60000*6));
		lenHours = Math.round(10*lenHours)/100;
		console.log( (lenHours) + " hours listening");

		songsPerHour = (d.length - 9) / lenHours;
		songsPerHour = Math.round(songsPerHour*10)/10;
		console.log( songsPerHour + " songs per hour" );
		console.log( (Math.round(songsPerHour * 33) / 10) + " minutes of music per hour" );

	});

};

go();
