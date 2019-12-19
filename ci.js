const fuzzyset = require('fuzzyset.js');
var https = require('https');
//var Discord = require('discord.js');

var b = FuzzySet(["dylan"]);

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.insult = function insult(message, args) {
	https.get('https://evilinsult.com/generate_insult.php?lang=en', (res) => {
		let data = '';
		res.on('data', (d) => {
			data+=d;
		});
		res.on('end', () => {
			if (args.length > 1) {
				message.channel.send(args[1].charAt(0).toUpperCase() + args[1].slice(1).toLowerCase()+', '+data);
			} else {
				message.channel.send(data);
			}
		});
	}).on('error', (e) => {
	  console.error(e);
	});
}

exports.insult2 = function (message, args) {
	https.get('https://insult.mattbas.org/api/insult', (res) => {
		let data = '';
		res.on('data', (d) => {
			data+=d;
		});
		res.on('end', () => {
			if (args.length > 1) {
				message.channel.send(args[1].charAt(0).toUpperCase() + args[1].slice(1).toLowerCase()+', '+data);
			} else {
				message.channel.send(data);
			}
		});
	}).on('error', (e) => {
	  console.error(e);
	});
}

exports.compliment = function compliment(message, args) {
	if (Math.random() > 0.7 && args.length > 1 && (b.get(args[1])!=null && b.get(args[1])[0][0] >= 0.75) 
		|| args[1].substring(3, args[1].length-1) == 146170702553153536) {
		https.get('https://evilinsult.com/generate_insult.php?lang=en', (res) => {
			let data = '';
			res.on('data', (d) => {
				data+=d;
			});
			res.on('end', () => {
				message.channel.send('No compliment for you Dylan. Here\'s an insult instead.');
				message.channel.send('Dylan, '+ data);
			});
		})
	} else {
		https.get('https://spreadsheets.google.com/feeds/list/1eEa2ra2yHBXVZ_ctH4J15tFSGEu-VTSunsrvaCAV598/od6/public/values?alt=json', (resp) => {
			let data = '';

			// A chunk of data has been recieved.
			resp.on('data', (chunk) => {
				data += chunk;
			});

			// The whole response has been received. Print out the result.
			resp.on('end', () => {
				data = JSON.parse(data);
				var rndInt = getRandomInt(0, data.feed.entry.length - 1);
				var compliment = data.feed.entry[rndInt]['gsx$compliments']['$t'];
				if (args.length > 1) {
					message.channel.send(args[1].charAt(0).toUpperCase() + args[1].slice(1).toLowerCase()+', '+compliment);
				} else {
					message.channel.send(compliment);
				}
			});
		}).on("error", (err) => {
			console.log("Error: " + err.message);	
		});
	}
}