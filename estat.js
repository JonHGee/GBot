var auth = require('./auth.json');
const mongo = require('mongodb').MongoClient;
const emojiRegex = require('emoji-regex');

const elist = new Map();
const uri = auth.db;

exports.init = function(bot) {
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
}

exports.regex = function(message) {
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
}	

exports.estat = function(message, args, elist, bot) {
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
}

exports.addReact = function(react, user) {
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
}

exports.removeReact = function(react, user) {
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
}

exports.emojiCreate = function(emoji) {
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
}

exports.emojiRemove = function(emoji) {
	elist.delete(emoji.id);
	console.log(`Emoji deleted: ${emoji.name}`)
}

exports.emojiUpdate = function(oldemoji, newemoji) {
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
}

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