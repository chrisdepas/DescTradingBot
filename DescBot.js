//
//		DescBot.js
//
//	Bot to sell/buy description tags for the game Team Fortress 2
//  	Using the Steam platform 
//
//	Author:		Chris De Pasquale
//	Created: 	Some time in 2014
//	Last Edit:	Cleaned up on 05/05/18
//	

var Steam = require('steam');
var fs = require('fs');
var SteamTrade = require('steam-trade');
var _ = require("underscore");

// ----- SETTINGS ------
var admin = ''; // Admin SteamID (for validating cmds via steam msg)
var BOT_NAME = "Desc Tag Bot";
var TF2_GAME_ID = 440;
var BOT_ACCOUNT_USERNAME = '';
var BOT_ACCOUNT_PASSWORD = '';
var BOT_ACCOUNT_AUTHCODE = '';
var BOT_ACCOUNT_USE_AUTHCODE = false;
var BOT_SENTRYFILE = 'sentryfile';
// ---------------------

var steamTrade = new SteamTrade();
var bot = new Steam.SteamClient();
var g_bCanTrade = false;

// Trading global vars
var g_BotInventory = [];
var g_BotInvRef = [];   // Refined metal in bots inventory (Items)
var g_BotInvDesc = [];  // Description tags in bots inventory (Items)
var g_TagsAdded = 0;    // Description tags added by trading player  
var g_RefAdded = 0;     // Refined metal added by trading player  
var g_RecAdded = 0;     // Reclaimed metal added by trading player 
var g_BotAddedRef = []; // Refined metal added to trade by bot (Items)
var g_BotAddedDesc = [];// Description tags added to trade by bot(Items)
var g_bCanOfferTrade = true;


// Begin login, all functionality occurs in callbacks after this succeeds
if (fs.existsSync(BOT_SENTRYFILE)) {
	var sentry = fs.readFileSync(BOT_SENTRYFILE);
	console.log('[STEAM] Logging in with saved sentry file \'' + BOT_SENTRYFILE + '\'');
	bot.logOn({ accountName: BOT_ACCOUNT_USERNAME, password: BOT_ACCOUNT_PASSWORD, shaSentryfile: sentry });
	
} else {
	if (BOT_ACCOUNT_USE_AUTHCODE) {
		console.log('[STEAM] Logging in with authcode \'' + BOT_ACCOUNT_AUTHCODE + '\'');
		bot.logOn({ accountName: BOT_ACCOUNT_USERNAME, password: BOT_ACCOUNT_PASSWORD, authCode: BOT_ACCOUNT_AUTHCODE });
		
	} else {
		console.log('[STEAM] Logging in with username \'' + BOT_ACCOUNT_USERNAME + '\'');
		bot.logOn({ accountName: BOT_ACCOUNT_USERNAME, password: BOT_ACCOUNT_PASSWORD });
		
	}
}

bot.on('loggedOn', function() {
	console.log('[STEAM] Logged in successfully');
	
	// Setup SteamFriends status and name
	bot.setPersonaState(Steam.EPersonaState.LookingToTrade);
	bot.setPersonaName(BOT_NAME);
	bot.addFriend(admin);

	// Just play everything - Steam will add time for each game seperately
	bot.gamesPlayed([550, 570, 630, 17500, 17700, 17580, 17550, 211, 215, 218, 17520, 17730, 17570, 17510, 640, 205, 310, 17505, 232250, 219, 65900, 32162, TF2_GAME_ID]);
});

var SendHelp = function(steamID) {
	bot.sendMessage(steamID, 'Hello, i am a bot selling/buying description tags. \nTo start, send me a trade request.\nCHAT COMMANDS: about, help, prices');
}

var SendAbout = function(steamID) {
	bot.sendMessage(steamID, 'I am a bot selling/buying description tags :) \n I was coded by Dirtyspah in 2014, on node.js. I use node-steam and node-steam-trade by seishun. (https://github.com/seishun/)');
}

var SendPrices = function(steamID) {
	bot.sendMessage(steamID, 'I am buying description tags for 2.00 refined each');
	bot.sendMessage(steamID, 'I am selling description tags for 2.66 refined each');
}

var EarlyExit = function(message) {
   throw new Error(message);
}

bot.on('friendMsg', function(steamID, msg, chatEntryType) {
	// Handle commands 
	if (chatEntryType == Steam.EChatEntryType.ChatMsg) {
		
		if (msg.toLowerCase() == 'help') {
			SendHelp(steamID);
			
		} else if (msg.toLowerCase() == 'about') {
			SendAbout(steamID);
			
		} else if (msg.toLowerCase() == 'prices') {
			SendPrices(steamID);
			
		} else if (msg.toLowerCase() == 'spook me' ) { 
			bot.sendMessage(steamID, "\n░░░░░░░░░░░░▐░░░░░░░░░░░\n░░░░░░▄▄▄░░▄██▄░░░░░░░░░\n░░░░░▐▀█▀▌░░░░▀█▄░░░░░░░\n░░░░░▐█▄█▌░░░░░░▀█▄░░░░░\n░░░░░░▀▄▀░░░▄▄▄▄▄▀▀░░░░░\n░░░░▄▄▄██▀▀▀▀░░░░░░░░░░░\n░░░█▀▄▄▄█░▀▀░░░░░░░░░░░░\n░░░▌░▄▄▄▐▌▀▀▀░░░░░░░░░░░\n▄░▐░░░▄▄░█░▀▀░░░░░░░░░░░\n▀█▌░░░▄░▀█▀░▀░░░░░░░░░░░\n░░░░░░░▄▄▐▌▄▄░░░░░░░░░░░\n░░░░░░░▀███▀█░▄░░░░░░░░░\n░░░░░░▐▌▀▄▀▄▀▐▄░░░░░░░░░\n░░░░░░▐▀░░░░░░▐▌░░░░░░░░\n░░░░░░█░░░░░░░░█░░░░░░░░\n░░░░░▐▌░░░░░░░░░█░░░░░░░\n░░░░░█░░░░░░░░░░▐▌░░░░░░");
			
		} else if (steamID == admin && msg.toLowerCase() == 'quit') {
			bot.sendMessage(steamID, "Bye dad!");
			EarlyExit("Received quit command");
			
		} else if (msg == '' || msg == ' ') {
			// Current bug in steamtrade -> 'X is now typing a message....' is sent as an empty ChatMsg
			return;
			
		} else {
			//Unknown chat cmd, send help.
			SendHelp(steamID);
		}
		
		console.log("[STEAM][MSG] " + bot.users[steamID].playerName + " (" + steamID + "): " + msg);
	}
});

bot.on('sentry', function(sentryHash)
	// Recieved saved login hash, can be used to login in future without credentials
	console.log('[STEAM] Received sentry file from Steam, saving to disk.');
	
	fs.writeFile(BOT_SENTRYFILE, sentryHash, function(err) {
		if (err) {
			console.log('[STEAM] Unable to save sentryfile \'' + BOT_SENTRYFILE + '\', reason: ' + err);
		} else {
			console.log('[STEAM] Successfully saved sentry file hash as \'' + BOT_SENTRYFILE + '\'');
		}
    });
});

bot.on('error', function(e) {
	console.log('[STEAM][ERROR] Login failed.');
	
	if (e.eresult == Steam.EResult.InvalidPassword) {
		console.log('[STEAM] Reason: Unable to log in - Invalid password.');
	} else if (e.eresult == Steam.EResult.AlreadyLoggedInElsewhere) {
		console.log('[STEAM] Reason: Error logging in - You are already in elsewhere.');
	} else if (e.eresult == Steam.EResult.AccountLogonDenied) {
		console.log('[STEAM] Reason: Logon denied - this usually means you are missing a sentry file, check your emails for a steamguard code.');
	} else if (e.eresult == 6) {
		// Result of 6 indicates account is logged in already, this currently doesn't have a constant in SteamTrade
		console.log('[STEAM] Reason: This account has been logged in elsewhere.');
	} else {
		console.log('[STEAM] Reason - Logon failed for unknown reason. (Code ' + e.eresult + ')');
	}
	
	EarlyExit("[STEAM] Quit due to unexpected error");
});

var onAddedFriend = function(steamID) {
	// Handles a friend request
	console.log('[STEAM] Received a friend request from ' + ' ID \'' + steamID + '\'');
	if (steamID == admin) {
		bot.sendMessage(steamID, "Hey dad!");
	} else {
		SendHelp( steamID );
	}
}

bot.on('friend', function(steamID, relation) {
	// Friend status changed while online
	if (relation == Steam.EFriendRelationship.RequestRecipient) {
		bot.addFriend(steamID);
		console.log('[STEAM] Received and accepted friend request from ID ' + steamID);
		onAddedFriend(steamID);
	}
});

bot.on('relationships', function() {
	// Friend status changed while offline. Accept all incoming requests
	_.each(bot.friends, function(relationship, steamID) {
        if (relationship == Steam.EFriendRelationship.RequestRecipient) {
            bot.addFriend(steamID);
            console.log("[STEAM] Received and accepted friend request from " + "ID '" + steamID + "'");
			onAddedFriend(steamID);
        }
    });
});

bot.on('webSessionID', function(sessionID) {
	// Steamtrade initialised
	console.log('[STEAM] Received a new session ID: ', sessionID);
	steamTrade.sessionID = sessionID;
	g_bCanTrade = true;
	
	bot.webLogOn(function(cookies) {
		console.log('[STEAM] Received a new cookie:', cookies);
		cookies.forEach(function(cookie) {
			steamTrade.setCookie(cookie);
		});
	});
	
	// Clear old (existing) friends, to be sure we don't reach the limit
	_.each(bot.friends, function(relationship, steamID) {
		if (relationship == Steam.EFriendRelationship.Friend) {
			if (steamID != admin) {
				bot.removeFriend(steamID);
			}
		}
	});
});

bot.on('tradeProposed', function(tradeID, otherClient) {
	console.log("[TRADE] Trade proposed by user '" + bot.users[otherClient].playerName + "'(ID:" + otherClient + ")");
	if (g_bCanTrade) {
		bot.respondToTrade(tradeID, true);
	} else {
		console.log("[TRADE] Trade declined, currently unable to trade.\n");
		bot.sendMessage(otherClient, "Sorry, I have just woken up and am not able to trade yet. Please try again in 30 seconds.");
		bot.respondToTrade(tradeID, false);
	}
});

bot.on('sessionStart', function(otherClient) {  
	bot.setPersonaName(BOT_NAME + ' [BUSY]');
	console.log("[STEAM] Started trading with player '" + bot.users[otherClient].playerName + "' (ID: '" + otherClient + "')");
	steamTrade.open(otherClient);
	steamTrade.chatMsg('Hello! Please be patient, this bot can take up to 20 seconds to initialise trading.');
	
	//Load inventory for TF2
	steamTrade.loadInventory(TF2_GAME_ID, 2, function(inv) {
		g_TagsAdded = 0;
		g_RefAdded = 0;
		g_RecAdded = 0;
		g_bCanOfferTrade = true;
		g_BotInventory = inv;
		g_BotInvRef = inv.filter(function(item) { return item.name == 'Refined Metal'; });
		g_BotInvDesc = inv.filter(function(item) { return item.name == 'Description Tag'; });
		steamTrade.chatMsg('Ready to trade. Type "stock" to see stock levels. Type "Help" to show help."');
		steamTrade.chatMsg('To buy, type "buy NUM", where NUM is the amount you want to buy. (e.g. buy 1)')
		steamTrade.chatMsg('To sell, type "sell NUM", where NUM is the amount you want to sell. (e.g. sell 1)');
	});
});

steamTrade.on('offerChanged', function(added, item) {
	console.log('[TRADE] User ' + (added ? 'added item \'' : 'removed item \'') + item.name + '\'');
	
    if (item.tags && (item.descriptions === '' || !item.descriptions.some(function(desc) {
		return desc.value == '( Not Usable in Crafting )';
	}))) {
		// Parse valid items which are usable in crafting
		if (item.name == 'Refined Metal') {
			g_RefAdded += added ? 1 : -1;
		} else if (item.name == 'Description Tag') {
			g_TagsAdded += added ? 1 : -1;
		} else if (item.name == 'Reclaimed Metal') {
			g_RecAdded += added ? 1 : -1;
		} else if (item.name == 'Scrap Metal' && added) {
			steamTrade.chatMsg('Sorry, scrap metal is currently not accepted. Please add Refined or reclaimed metal only.');	
		}
		
	} else {
		steamTrade.chatMsg('Error: Uncraftable item added. Please remove.');
	}
});

var CheckAndAccept = function() {
	// Checks contents of 
	
	// Calculate current total currency (in metal) added by player
	// Where 1 refined metal = 1.00,
	// 1 reclaimed metal = 0.33 (1/3 of refined)
	var addedCash = 0.0;
	addedCash += g_RefAdded;
	addedCash += Math.floor(g_RecAdded / 3);
	addedCash += 0.33 * (g_RecAdded % 3);

	var WorthInDesc = Math.floor(addedCash / 2.66);
	if (g_BotAddedDesc.length <= WorthInDesc && g_BotAddedRef.length / 2 <= g_TagsAdded ) {
		// Have they paid atleast the price
		steamTrade.ready(function() {
			console.log('[STEAM] Recieved valid trade, confirming.');
			steamTrade.confirm();
		});
		
	} else {
		if (g_BotAddedDesc.length > WorthInDesc) {
			steamTrade.chatMsg("Trade invalid. Please add more metal. (Need " + g_BotAddedDesc.length * 2.66 + ")");
			console.log("[STEAM] Invalid trade. Reason - not enough metal (Need " + g_BotAddedDesc.length * 2.66 + ", have " + addedCash + ")"); 
		}
		if ( (g_BotAddedRef.length / 2) > g_TagsAdded) {
			steamTrade.chatMsg("Trade invalid. Please add more description tags. (Need " + g_BotAddedRef.length / 2 + ")");
			console.log("[STEAM] Invalid trade. Reason - not enough tags (Need " + (g_BotAddedRef.length / 2) + ", have " + g_TagsAdded + ")"); 
		}
		steamTrade.chatMsg("Unable to accept trade");
	}
}

steamTrade.on('ready', function() {
	// Player set ready status for trade
	console.log('[TRADE] Trade readied, checking trade validity.');
	steamTrade.chatMsg("Checking trade validity.");
	setTimeout(CheckAndAccept, 1000);
});

steamTrade.on('end', function(result) {
	// Trade complete
	console.log('[TRADE] Trade completed with result: ', result);

	// Remove [BUSY] tag from name
	bot.setPersonaName(BOT_NAME);
});

steamTrade.on('chatMsg', function(msg) {
	// Recieved chat message from within trading window 
	var args = msg.split(" ");
	var arglen = args.length;
	
	if (msg.toLowerCase() == 'stock' || msg.toLowerCase() == 'help') {
		if (msg.toLowerCase == 'help') {
			// If requesting help, display both help message and stock levels
			steamTrade.chatMsg('To buy: type "buy NUM", e.g. buy 1');
			steamTrade.chatMsg('To sell: type "sell NUM", e.g. sell 1');
		}
		
		// Get amount of Refined metal and Description Tags in bot's inventory 
		var numdesc = 0;
		var numref = 0;
		_.each(g_BotInventory, function(item) {
			if (item.name == 'Refined Metal') {
				numref++;
			} else if (item.name == 'Description Tag') {
				numdesc++;
			}
		});
		
		// Max description tags bot can buy
		var numBuyableDesc =  Math.floor(numref / 2);
		steamTrade.chatMsg('\nStock Levels :\nDesc tags: ' + numdesc + ' [Buying @ 2.00, Selling @ 2.66]\nRefined Metal: ' + numref);
		steamTrade.chatMsg('I can buy ' + numBuyableDesc + ' description tags\nI can sell ' + numdesc + ' description tags');
	
	} else if (arglen >= 2) {
		
		if (args[0].toLowerCase() == 'buy') {
			if (g_bCanOfferTrade) {
				var amountbuy = args[1];
				if (amountbuy <= 0 || amountbuy > 100) {
					steamTrade.chatMsg("Invalid amount of tags '" + amountbuy + "'");
					
				} else if (amountbuy <= g_BotInvDesc.length) {
					// Recieved buy order for a valid amount, add description tags
					g_bCanOfferTrade = false;
					var newDesc = g_BotInvDesc[g_BotAddedDesc.length];
					steamTrade.addItems([newDesc]);
					g_BotAddedDesc.push(newDesc);
					
					steamTrade.chatMsg("Please add " + 2.66 * amountbuy + " refined.");

				} else {
					// User requested more description tags than the bot has 
					steamTrade.chatMsg("Error: the maximum amount of description tags I can sell is " + g_BotInvDesc.length);
				}
				
			} else {
				// Recieved buy request during an existing trade request
				steamTrade.chatMsg("Error - you have already asked to buy/sell. To change this, please restart trade.");
			}
			
		} else if (args[0].toLowerCase() == 'sell') {
			if (g_bCanOfferTrade) {
				var amountsell = args[1];
				if (amountsell <= 0 || amountsell > 100) {
					steamTrade.chatMsg("Invalid amount of tags '" + amountbuy + "'");
					
				} else if (amountsell * 2 <= g_BotInvRef.length ) {
					// Recieved sell order for a valid amount of description tags, add refined metal
					g_bCanOfferTrade = false;
					var newRef = g_BotInvRef[g_BotAddedRef.length];
					steamTrade.addItems([newRef]);
					g_BotAddedRef.push(newRef);
					
					newRef = g_BotInvRef[g_BotAddedRef.length];
					steamTrade.addItems([newRef]);
					g_BotAddedRef.push(newRef);
					steamTrade.chatMsg("Please add " + amountsell + " tags.");
					
				} else {
					// User requested to sell more description tags than the bot can afford 
					steamTrade.chatMsg("Error: the maximum amount of description tags i can buy is " + Math.floor(g_BotInvRef.length / 2) + " (you entered " + amountsell + ")");
				}
				
			} else {
				// Recieved sell request during an existing trade request
				steamTrade.chatMsg("Error - you have already asked to buy/sell. To change this, please restart trade.");
			}
		}
	}
});
