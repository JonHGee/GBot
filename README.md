# GBot
A Discord bot used for tracking emoji usage(with a few extra functionalities)

### NOTE: code will not compile without supplying your own discord bot token and mongodb URL

## About
This bot is built using node.js.  It interfaces with MongoDB to store emoji usage in two collections () emojis by server, and emojis by user).
It also connects to several web APIs to generate compliments and insults.

# Commands currently supported
All commands currently support tagging users. i.e if you send command !i @jon, the bot will also tag @jon it it's response.

## estat (cmd)
All emoji usage tracking is done through the estat command.  If no cmd is specified, the bot returns a list of most used emojis on the server.  If a cmd that is not supported is given, the bot will assume print an error in console.

### Most used emojis in server - estat
```
!estat
```
Returns a list of the 10 most used emojis on the server.  Custom emojis that the bot has access to and native emojis will be displayed.  Custom emojis that the bot does not have access to will be displayed in :emoji: format.

### Least used custom emojis in server - estat here
```
!estat here
```
Returns a list of the 10 least used custom emojis of the current server.

### Most emojis used by a user - estat @user
```
!estat @user
```
Looks up the top 10 most used emojis by the tagged user.  Custom emojis that the bot has access to and native emojis will be displayed.  Custom emojis that the bot does not have access to will be displayed in :emoji: format.

## Other commands

### help
```
!help
```
Sends a list of supported commands to the channel

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

