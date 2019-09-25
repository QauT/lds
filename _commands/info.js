const botconfig = require("../_configuration/bot_config.json")
const defaultconfig = require("../_configuration/bot_embed.json")
const functions = require('../functions');
const Discord = require("discord.js")
const client = new Discord.Client({ disableEveryone: true })

module.exports.run = async (client, message, args) => {
  
       //info variables
       let guildcount = client.guilds.size
       let versioncontrol = botconfig.version
  
       let info_embed = new Discord.RichEmbed()
            .setTitle("Bot information")
            .setDescription(client.user.tag)
            .addField("Version", versioncontrol, true)
            .addField("Servers", guildcount, true)
            .addField("Join date", functions.date(message.guild.joinedAt), true)
            .addField("Current Uptime", functions.uptimeProcess(), true)
            .addField("Bot Creators", "Fluxpuck#9999\nTheFallenShade#5557\nVictor L#0001")
            .setColor(botconfig.embed_color)
            .setThumbnail(client.user.avatarURL)
            .setTimestamp()
            .setFooter(client.user.username, client.user.avatarURL)

        return message.channel.send(info_embed)
  
}

module.exports.help = {
  name: "info"
}



