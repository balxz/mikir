// 10:41
let b = require("./configuration");

// -- --
// UBAH NYA DI FILE configuration.js
// -- --

global.owner = b.owner;
global.author = b.name;
global.bot = {
    status: b.bot.status,
    sesi: b.bot.sesi,
    pair: b.bot.pair,
    code: b.bot.code
};
global.sticker = {
    name: b.stc.name,
    author: b.stc.author
};

//console.log(owner, author, bot, sticker);

global.fs = require("node:fs");
global.axios = require("axios");
global.chalk = require("chalk");
global.bail = require("baileys");
global.path = require("node:path");
global.start = Date.now();
