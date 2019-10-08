//construct bot requirements
const functions = require("./functions");
const botconfig = require("./_configuration/bot_config.json");
const defaultconfig = require("./_configuration/bot_embed.json");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const fs = require("fs");
const client = new Discord.Client({ disableEveryone: true });

// => Keeps the bot online
const http = require("http");
const express = require("express");
const app = express();
app.get("/", (request, response) => {
  response.sendStatus(200);
  // console.log(Date.now() + " Ping Received");
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 28000);

//command modules || command handler
client.commands = new Discord.Collection();

console.log("-----");

fs.readdir("./_commands/", (err, files) => {
  if (err) console.log(err);

  let jsfile = files.filter(f => f.split(".").pop() === "js");
  if (jsfile.length <= 0) {
    console.log("Couldn't find commands.");
    return;
  }

  console.log(`Commands loading... \n=>`);
  jsfile.forEach((f, i) => {
    let props = require(`./_commands/${f}`);
    console.log(`${f} loaded!`);
    client.commands.set(props.help.name, props);
  });
});

client.on("ready", async () => {
  console.log("-----");

  //connection message
  console.log(client.user.tag + " connected succesfully to:");

  //connected servers + channels
  client.guilds.forEach(guild => {
    console.log("server: " + guild.name);

    //connected channels
    // guild.channels.forEach((channel) => {
    //     console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
    // })
  });

  //bot activity
  client.user
    .setActivity("Lyrics in " + client.guilds.size + " servers", {
      type: "LISTENING"
    })
    .then(presence =>
      console.log(
        `Bot activity set to ${presence.game ? presence.game.name : "none"}`
      )
    )
    .catch(console.error);
});

client.on("message", async message => {
  //default botconfig
  let versioncontrol = botconfig.version;
  let defaultprefix = botconfig.prefix;

  //default prefix
  let prefixes = JSON.parse(fs.readFileSync("./_server/prefixes.json", "utf8"));
  if (!prefixes[message.guild.id]) {
    prefixes[message.guild.id] = {
      prefixes: defaultprefix
    };
  }
  let prefix = prefixes[message.guild.id].prefixes;

  //default channel
  let defaultchannel;
  let dchannel = JSON.parse(
    fs.readFileSync("./_server/defaultchannel.json", "utf8")
  );
  if (!dchannel[message.guild.id]) {
    defaultchannel = "";
  } else {
    defaultchannel = dchannel[message.guild.id].defaultchannel;
  }

  // AUTO NFSW IMAGE DETECTION SYSTEM => //
  if (message.channel.id == "553098761635889191") {
    let commandfile = client.commands.get("vision");
    if (commandfile) commandfile.run(client, message);
  }

  //ignore messages from bot itself & private messages
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;
  if (defaultchannel) {
    if (message.channel.id != defaultchannel) return;
  } else {
  }

  //give prefix when mentioned
  if (
    message.mentions.users.size > 0 &&
    message.mentions.users.first().id == client.user.id &&
    args.length == 0
  )
    message.channel.send(
      `My prefix is: \`${prefixes[message.guild.id].prefixes}\``
    );

  //command processor
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);

  //command handler
  if (!message.content.startsWith(prefix)) return;
  let commandfile = client.commands.get(cmd.slice(prefix.length));
  if (commandfile) commandfile.run(client, message, args);
});

client.login(process.env.BOT_TOKEN);
