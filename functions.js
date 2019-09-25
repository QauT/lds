//construct requirements
const botconfig = require("./_configuration/bot_config.json")
const defaultconfig = require("./_configuration/bot_embed.json")
const functions = require('./functions');
const Discord = require("discord.js")
const fetch = require("node-fetch");
const fs = require('fs');
const client = new Discord.Client({ disableEveryone: true })

module.exports = {

    serverCountmsg: function f(data) {
        if (data <= 1) {
            return data + " server"
        } else {
            return data + " servers"
        }
    },

    capitalize: function capitalize(str) {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                if (txt.charAt(0) == "'") {
                    return
                } else {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            }
        );
    },

    string_to_array: function string_to_array(str) {
        return str.trim().split(" ");
    },

    containsAny: function containsAny(source, target) {
        var result = source.filter(function (item) { return target.indexOf(item) > -1 });
        return (result.length > 0);
    },
  
    uptimeProcess: function uptimeProcess() {
    var s = process.uptime()
    var date = new Date(null);
    date.setSeconds(s);
    var uptime_bot = date.toISOString().substr(11, 8);
    return uptime_bot
    },
  
    date: function date(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    return day + ' ' + monthNames[monthIndex] + ' ' + year;
    }

};