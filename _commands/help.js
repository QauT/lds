const botconfig = require("../_configuration/bot_config.json")
const defaultconfig = require("../_configuration/bot_embed.json")
const Discord = require("discord.js")

module.exports.run = async (client, message, args) => {
  let helpEmbed = new Discord.RichEmbed()
  .setColor(defaultconfig.embed_color)
  .setAuthor(client.user.username);
  let availableCommands = "";
  client.commands.forEach((cmd) => {
    availableCommands += `${cmd.help.name} `;
  })
  availableCommands = availableCommands.substring(0, availableCommands.length - 1); // Remove the unnecessary space.
  helpEmbed.addField("Available Commands:", `${availableCommands}`);
  message.channel.send({embed: helpEmbed});
}

module.exports.help = {
    name: "help"
}