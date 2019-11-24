var Discord = require('discord.js');
var auth = require('./auth.json');
const fuzzyset = require('fuzzyset.js');
var https = require('https');
const mongo = require('mongodb').MongoClient;
const emojiRegex = require('emoji-regex');

const uri = auth.db;
//const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Initialize Discord Bot
const bot = new Discord.Client();
bot.login(auth.token);

//Map of custom server emojis the bot has access to
//Initialized when the bot connects to discord
const elist = new Map();


//Bot startup. Gives a console confirmation, updates database with any new custom emojis, and populates custom emoji list
bot.on('ready', function (evt) {
    console.log('Connected');
    console.log('Logged in as: ');
	console.log(bot.user.tag);
	bot.user.setActivity("you ( ͡° ͜ʖ ͡°)", {type: "WATCHING"});
	bot.emojis.forEach(emoji => elist.set(emoji.id, emoji.name));
	
	mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
		const collection = client.db("discord_tracker").collection("emojis");
		//updates server specific database
		bot.emojis.forEach(emoji => 
			collection.updateOne(
				{'server': emoji.guild.id, 'emoji': emoji.name, 'id': emoji.id}, 
				{$setOnInsert: {'usage': 0}},
				{upsert:true}
			)
		);
		client.close();
	});
	/*
	bot.guilds.forEach((guild) => {
        console.log(" - " + guild.name);
	
        // List all channels
        guild.members.forEach(function(member, memberid){
            console.log(` -- ${memberid} - ${member.nickname} - ${member.colorRole}`);
        });
    });
	*/
	
});

var a = FuzzySet(["i'm drunk", "drunk"]);
var b = FuzzySet(["dylan"]);
var dylancount = 0;
var lastchannel = 0;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

bot.on('message', (message) => {
    //Ignores message if the bot sends it. Prevents infinite loops
	if (message.author == bot.user) {
        return
    }
	
	//Tells a specific user to quiet down if they speak too much ;)
	if (message.author.id == 146170702553153536) {
		dylancount++;
		if (dylancount > 4) {
			message.channel.send('shut up dylan');
		}
	} else {
		dylancount = 0;
	}
	
	
	//Reinforces the idea that your inebriation is your problem
	if (a.get(message.content)!=null && a.get(message.content)[0][0] >= 0.75) {
		message.channel.send('Nobody cares, ' + message.author.username);
	}
	
	//Command list
	if (message.content.substring(0, 1) == '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0].toLowerCase();
		
        switch(cmd) {
            // !ping
            case 'ping':
                message.channel.send('Pong!');
				break;
			// responds hello back to user
            case 'hello':
				message.channel.send('Hello ' + message.author+"!");
				break;
			//generates insult from evil insult	
			case 'insult':
			case 'i':
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
				break;
				
			//randomly generates insult from template
			case 'insult2':
			case 'i2':
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
				break;
				
			//gives a coimpliment.  Insults dylan 30% of the time.
			case 'compliemnt':
			case 'c':
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
				break;
				
			//Generic help message
			case 'help':
				message.channel.send(
				'```Commands currently supported \n'+
				'!help: command list \n'+
				'!compliment/!c (name): sends a compliment\n'+
				'!insult/!i (name): sends an insult\n'+
				'!insult2/!i2 (name): sends a randomly generated insult```'
				);
				break;
			
			//Sends a message of all available custom emojis on the server
			case 'emojilist':
				const emojiList = message.guild.emojis.map(e=>e.toString()).join(" ");
				if(emojiList) {
					message.channel.send(emojiList);
				} else {
					message.channel.send('No custom emojis on server');
				}
				break;
			
			
			case 'estat':
				if (args[1]) {
					var ecmd = args[1].toLowerCase();
					switch(ecmd) {
						//Returns the least used custom emojis of a server
						case 'here':
							console.log(`estat here - ${message.guild.name}`);
							if (message.guild.emojis.size > 0) {
								mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
									const collection = client.db("discord_tracker").collection("emojis");
									//console.log(serveremojis(message.guild.emojis));
									//Checks the DB for the 10 emojis with lowest usage
									//Must also match the server's custom emoji list
									collection.
										find({$and:[{'server' : message.guild.id}, serveremojis(message.guild.emojis)]}).
										sort({'usage' : 1}).
										limit(10).
										project({'_id':0,'emoji':1,'id':1,'usage':1}).
										toArray(function(err, results) {
											var msg = 'Least used custom emojis in server:\n'
											for(let x of results) {
												
												if (x.id == 'native') {
													msg = msg + `${x.emoji}: ${x.usage}\n`;
												} else if (elist.has(x.id)) {
													msg = msg + `<:${x.emoji}:${x.id}>: ${x.usage}\n`;
												} else {
													msg = msg + `:${x.emoji}: ${x.usage}\n`;
												}
											}
											message.channel.send(msg);
										});
						
								client.close(); 
								});
							} else {
								message.channel.send('Server has no custom emojis');
							}
							break;

						
						default:
							// Checks a user specific database for most emojis used by a certain user
							var usr = ecmd.match(/<@\d{18}>/);
							var usr2 = ecmd.match(/<@!\d{18}>/);
							if (usr || usr2) {
								if (usr) {
									var userid = ecmd.substring(2, ecmd.length-1);
								} else {
									var userid = ecmd.substring(3, ecmd.length-1);
								}
								bot.fetchUser(userid).then(function (user) {
									console.log(`estat user - ${user.username}`);
								}).catch (function () {
									console.log(`User ID ${userid} lookup unsuccessful`);
								});
								mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
									const collection = client.db("discord_tracker").collection("emojis_by_name");
									collection.
										find({'user' : userid}).
										sort({'usage' : -1}).
										limit(10).
										project({'_id':0,'emoji':1,'id':1,'usage':1}).
										toArray(function(err, results) {
											var msg = `${ecmd}\'s Most used emojis:\n`;
											for(let x of results) {
												if (x.id == 'native') {
													msg = msg + `${x.emoji}: ${x.usage}\n`;
												} else if (elist.has(x.id)) {
													msg = msg + `<:${x.emoji}:${x.id}>: ${x.usage}\n`;
												} else {
													msg = msg + `:${x.emoji}: ${x.usage}\n`;
												}
											}
									message.channel.send(msg);
									});
								client.close();
								});
							} else {						
								console.log(`estat ${args[1]} - Bogus command`);
							}
							
							break;
					}
				} else {
					//Default case
					//Displays the 10 most used emojis on a server 
					mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
						const collection = client.db("discord_tracker").collection("emojis");
						collection.
							find({'server' : message.guild.id}).
							sort({'usage' : -1}).
							limit(10).
							project({'_id':0,'emoji':1,'id':1,'usage':1}).
							toArray(function(err, results) {
								var msg = 'Most used emojis in server:\n'
								for(let x of results) {
									
									if (x.id == 'native') {
										msg = msg + `${x.emoji}: ${x.usage}\n`;
									} else if (elist.has(x.id)) {
										msg = msg + `<:${x.emoji}:${x.id}>: ${x.usage}\n`;
									} else {
										msg = msg + `:${x.emoji}: ${x.usage}\n`;
									}
								}
								message.channel.send(msg);
						});
					
					client.close();
					});
				}
				break;
            // Just add any case commands if you want to..
        }
    }
	
	
	//Custom emoji regex matching
	var regex = new RegExp(/<:\w+:\d{18}>/g);
	var result = message.content.match(regex);
	if (result) {
		for (let e of result) {
			let emoji = e.substring(1,e.length-1).split(':')
			
			mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
				const collection = client.db("discord_tracker").collection("emojis");
				const collection2 = client.db("discord_tracker").collection("emojis_by_name");
			
				//updates server specific database
				collection.updateOne(
					{'server': message.guild.id, 'emoji': emoji[1], 'id': emoji[2]}, 
					{$inc: {'usage': 1}, $set: {'used': Date.now()}},
					{upsert:true}
				);
				// updates user specific database
				collection2.updateOne(
					{'user': message.author.id, 'emoji': emoji[1], 'id': emoji[2]}, 
					{$inc: {'usage': 1}, $set: {'used': Date.now()}},
					{upsert:true}
				);
		
				client.close();
			});
			
		}
	}
	
	//Native emoji regex matcher
	const regex2 = emojiRegex();
	let match;
	while (match = regex2.exec(message.content)) {
		const emoji = match[0];
		mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
			const collection = client.db("discord_tracker").collection("emojis");
			const collection2 = client.db("discord_tracker").collection("emojis_by_name");
		
			//updates server specific database
			collection.updateOne(
				{'server': message.guild.id, 'emoji': emoji, 'id': 'native'}, 
				{$inc: {'usage': 1}, $set: {'used': Date.now()}},
				{upsert:true}
			);
			// updates user specific database
			collection2.updateOne(
				{'user': message.author.id, 'emoji': emoji,'id': 'native'}, 
				{$inc: {'usage': 1}, $set: {'used': Date.now()}},
				{upsert:true}
			);
	
			client.close();
		});
	}
	
	//console.log(message.content);
	lastchannel = message.channel;
});

bot.on('raw', packet => {
    // We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    // Grab the channel to check the message from
    const channel = bot.channels.get(packet.d.channel_id);
    // There's no need to emit if the message is cached, because the event will fire anyway for that
    if (channel.messages.has(packet.d.message_id)) return;
    // Since we have confirmed the message is not cached, let's fetch it
    channel.fetchMessage(packet.d.message_id).then(message => {
        // Emojis can have identifiers of name:id format, so we have to account for that case as well
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        // This gives us the reaction we need to emit the event properly, in top of the message object
        const reaction = message.reactions.get(emoji);
        // Adds the currently reacting user to the reaction's users collection.
        if (reaction) reaction.users.set(packet.d.user_id, bot.users.get(packet.d.user_id));
        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            bot.emit('messageReactionAdd', reaction, bot.users.get(packet.d.user_id));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            bot.emit('messageReactionRemove', reaction, bot.users.get(packet.d.user_id));
        }
    });
});

//Updates the database when a new React is added to a message
bot.on('messageReactionAdd', (react, user) => {
	mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
	const collection = client.db("discord_tracker").collection("emojis");
	const collection2 = client.db("discord_tracker").collection("emojis_by_name");
	//Checks if custom emoji or native emoji
	if (react.emoji.id) {
		//updates server specific database
		collection.updateOne(
			{'server': react.message.guild.id, 'emoji': react.emoji.name, 'id': react.emoji.id}, 
			{$inc: {'usage': 1}, $set: {'used': Date.now()}},
			{upsert:true}
		);
		// updates user specific database
		collection2.updateOne(
			{'user': user.id, 'emoji': react.emoji.name,'id': react.emoji.id}, 
			{$inc: {'usage': 1}, $set: {'used': Date.now()}},
			{upsert:true}
		);
	} else {
		//updates server specific database
		collection.updateOne(
			{'server': react.message.guild.id, 'emoji': react.emoji.name, 'id': 'native'}, 
			{$inc: {'usage': 1}, $set: {'used': Date.now()}},
			{upsert:true}
		);
		// updates user specific database
		collection2.updateOne(
			{'user': user.id, 'emoji': react.emoji.name,'id': 'native'}, 
			{$inc: {'usage': 1}, $set: {'used': Date.now()}},
			{upsert:true}
		);
	}
	
	client.close();
	});
});

//Updates the database when a new React is removed from a message
bot.on('messageReactionRemove', (react, user) => {
	mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
	const collection = client.db("discord_tracker").collection("emojis");
	const collection2 = client.db("discord_tracker").collection("emojis_by_name");
	
	//Checks if custom emoji or native emoji
	if (react.emoji.id) {
		//updates server specific database
		collection.updateOne(
			{'server': react.message.guild.id, 'emoji': react.emoji.name, 'id': react.emoji.id}, 
			{$inc: {'usage': -1}},
			{upsert:true}
		);
		// updates user specific database
		collection2.updateOne(
			{'user': user.id, 'emoji': react.emoji.name,'id': react.emoji.id}, 
			{$inc: {'usage': -1}},
			{upsert:true}
		);
	} else {
		//updates server specific database
		collection.updateOne(
			{'server': react.message.guild.id, 'emoji': react.emoji.name, 'id': 'native'}, 
			{$inc: {'usage': -1}, $set: {'used': Date.now()}},
			{upsert:true}
		);
		// updates user specific database
		collection2.updateOne(
			{'user': user.id, 'emoji': react.emoji.name,'id': 'native'}, 
			{$inc: {'usage': -1}, $set: {'used': Date.now()}},
			{upsert:true}
		);
	}
	
	client.close();
	});
});

//Updates the database when a new emoji is added to a server
bot.on('emojiCreate', (emoji) => {
	elist.set(emoji.id, emoji.name);
	mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
		const collection = client.db("discord_tracker").collection("emojis");
	
		//updates server specific database
		collection.updateOne(
			{'server': emoji.guild.id, 'emoji': emoji.name, 'id': emoji.id}, 
			{$setOnInsert: {'usage': 0}, $set: {'used': Date.now()}},
			{upsert:true}
		);
		

		client.close();
	});
	console.log(`Emoji created: ${emoji.name}`)
});

//Updates the database when an emoji is removed from a server
bot.on('emojiDelete', (emoji) => {
	elist.delete(emoji.id);
	console.log(`Emoji deleted: ${emoji.name}`)
});

//Updates the database when an emoji is changed in a server
bot.on('emojiUpdate', (oldemoji, newemoji) => {
	elist.set(newemoji.id, newemoji.name);
	mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client) => {
			const collection = client.db("discord_tracker").collection("emojis");
			const collection2 = client.db("discord_tracker").collection("emojis_by_name");
		
			//updates server specific database
			collection.update(
				{'id': oldemoji.id}, 
				{$set: {'name': newemoji.name}},
				{upsert:true}
			);
			// updates user specific database
			collection2.update(
				{'id': oldemoji.id}, 
				{$set: {'name': newemoji.name}},
				{upsert:true}
			);
	
			client.close();
		});
	console.log(`Emoji updated: ${oldemoji.name} -> ${newemoji.name}`)
});

//puts together an OR query of all custom emojis of a given server
function serveremojis(emojilist) {
	if (emojilist.size == 1) {
		var query = {'id':emojilist.first().id}
		return query;
	}
	var wrapper = {"$or": []};
	emojilist.forEach(function (emoji) {
		wrapper["$or"].push({'id':emoji.id});
	});
	//console.log(wrapper);
	return wrapper;
}