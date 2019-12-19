var Discord = require('discord.js');
var auth = require('./auth.json');
var ci = require('./ci.js');
var estat = require('./estat.js');
const fuzzyset = require('fuzzyset.js');
const mongo = require('mongodb').MongoClient;


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
	estat.init(bot);
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
var dylancount = 0;
var lastchannel = 0;

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
            //Generic help message - Lists commands possible
			case 'help':
				message.channel.send(
				'```Commands currently supported \n'+
				'!help: command list \n'+
				'!compliment/!c (name): sends a compliment\n'+
				'!insult/!i (name): sends an insult\n'+
				'!insult2/!i2 (name): sends a randomly generated insult```'
				);
				break;
			
				
			//generates insult from evil insult	
			case 'insult':
			case 'i':
				ci.insult(message, args);
				break;
				
			//randomly generates insult from template
			case 'insult2':
			case 'i2':
				ci.insult2(message, args);
				break;
				
			//gives a coimpliment.  Insults dylan 30% of the time.
			case 'compliemnt':
			case 'c':
				ci.compliment(message, args);
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
				estat.estat(message, args, elist, bot);
				break;
            // Just add any case commands if you want to..
        }
    }
	
	estat.regex(message);
	
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
	estat.addReact(react, user);
});

//Updates the database when a new React is removed from a message
bot.on('messageReactionRemove', (react, user) => {
	estat.removeReact(react, user);
});

//Updates the database when a new emoji is added to a server
bot.on('emojiCreate', (emoji) => {
	estat.emojiCreate(emoji);
});

//Updates the database when an emoji is removed from a server
bot.on('emojiDelete', (emoji) => {
	estat.emojiRemove(emoji);
});

//Updates the database when an emoji is changed in a server
bot.on('emojiUpdate', (oldemoji, newemoji) => {
	estat.emojiUpdate(oldemoji, newemoji);
});