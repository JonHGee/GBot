# GBot
A Discord bot used for tracking emoji usage(with a few extra functionalities)

### NOTE: code will not compile without supplying your own discord bot token and mongodb URL

## About
This bot is built using node.js.  It interfaces with MongoDB to store emoji usage in two collections () emojis by server, and emojis by user).
It also connects to several web APIs to generate compliments and insults.

## Commands currently supported
All commands currently support tagging users. i.e if you send command !i @jon, the bot will also tag @jon it it's response.

### help
```
!help
```
Sends a list of supported commands to the channel
'```Commands currently supported \n'+
				'!help: command list \n'+
				'!compliment/!c (name): sends a compliment\n'+
				'!insult/!i (name): sends an insult\n'+
				'!insult2/!i2 (name): sends a randomly generated insult```'
### compliment
```
!c (name)
!compliment (name)
```
Name field optional.  Generates a compliment from this compliment list: https://spreadsheets.google.com/feeds/list/1eEa2ra2yHBXVZ_ctH4J15tFSGEu-VTSunsrvaCAV598/od6/public/values?alt=json.  May give you a surprise if you try to compliment someone named Dylan...

### insult
```
!i (name)
!insult (name)
```
Name field optional.  Generates an insult from https://evilinsult.com/

### insult2
```
!i2 (name)
!insult2 (name)
```
Name field optional.  Generates an insult from 'https://insult.mattbas.org/.  These are procedurally generated from a template.

### estat (cmd)
