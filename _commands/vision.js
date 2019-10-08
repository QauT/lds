const botconfig = require("../_configuration/bot_config.json");
const defaultconfig = require("../_configuration/bot_embed.json");
const functions = require("../functions");
const vision = require("@google-cloud/vision");
const download = require("image-downloader");
const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client({ disableEveryone: true });

// Creates a client
const client_2 = new vision.ImageAnnotatorClient({
  projectId: botconfig.google_projectID,
  keyFilename: "./_configuration/Google_api_key.json"
});

module.exports.run = async (client, message, args) => {
  //construct message ID
  let lastmsg = message.channel.lastMessageID;

  //check if message has attachments else do nothing
  if (message.attachments.size > 0) {
    let msg = message.attachments;
    let image_url, filePath;
    msg.forEach(elements => {
      image_url = elements.url;
    });

    // Download to a directory and save with an another filename
    options = {
      url: image_url,
      dest: "./photo.jpg" // Save to /path/to/dest/photo.jpg
    };

    //save image to selected path
    download
      .image(options)
      .then(({ filename, image }) => {
        //Google Vision AI - API
        client_2
          //get safeSearch details
          .safeSearchDetection(filename)
          .then(results => {
            //construct NSFW result and RACY result
            const safeSearch = results[0].safeSearchAnnotation.adult;
            const racySearch = results[0].safeSearchAnnotation.racy;

            console.log(safeSearch);

            //check if image is likely to be NSFW else if RACY
            if (safeSearch == "LIKELY" || safeSearch == "VERY_LIKELY") {
              message.channel.fetchMessage(lastmsg).then(msg => msg.delete());
              client.channels
                .get(`553114278383714304`)
                .send("Explicit image has been removed from #dank-memes");
              console.log("Explicit image has been removed");
              // message.channel.send(
              //   "⚠ WOW, hold on there! Your image was not PG and has been removed! \nIf you think your image was PG, please contact a moderator."
              // );
            } else if (racySearch == "LIKELY" || racySearch == "VERY_LIKELY") {
              message.channel.fetchMessage(lastmsg).then(msg => msg.delete());
              client.channels
                .get(`553114278383714304`)
                .send("Explicit image has been removed from #dank-memes");
              console.log("Explicit image has been removed");
              // message.channel.send(
              //   "⚠ WOW, hold on there! Your image was not PG and has been removed! \nIf you think your image was PG, please contact a moderator."
              // );
            } else {
              console.log("Image is safe!");
            }
          })
          .catch(err => {
            console.error("safeSearchAnnotation: " + err);
          });
      })
      .catch(err => console.error("Download err: " + err));
  }
};

module.exports.help = {
  name: "vision"
};
