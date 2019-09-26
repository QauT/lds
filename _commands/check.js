const botconfig = require("../_configuration/bot_config.json")
const defaultconfig = require("../_configuration/bot_embed.json")
const functions = require('../functions');
const rp = require('request-promise');
const $ = require('cheerio');
const request = require("request");
const fs = require('fs');
var _ = require('lodash');
const Discord = require("discord.js")
const client = new Discord.Client({ disableEveryone: true })

module.exports.run = async (client, message, args) => {

    //Create nice capitalized title, ready for fetch
    let messageArr = []
    args.forEach(function (element) {
        let msg_cap = functions.capitalize(element)
        messageArr.push(msg_cap)
    });
    let msg_title = messageArr.toString().replace(/[&\/\\#,+()$~%.":*?<>{}]/g, ' ').trim()

    // Removal of [official audio] , [official video] etc
    msg_title = msg_title.toLowerCase();
    let officialsToRemove = ["[official audio]", "[official video]", "[official music video]", "[monstercat realease]", "[monstercat Official Music Video]", "[NCS Release]", "(official music video)", "(original mix)", "(official video)", "(official audio)", "(official videoclip)"];
    officialsToRemove.forEach((term) => {
      if (msg_title.includes(term.toLowerCase())) {
        msg_title = msg_title.replace(term, ' ').trim();
      }
    })
  
    let msg_titleArr = msg_title.split(" ");
    msg_title = "";
    msg_titleArr.forEach((word) => {
      msg_title += functions.capitalize(word);
      msg_title += " "
    })
    
    //fetching-message
    message.channel.send("Checking lyrics for " + msg_title + "...")
        .then(msg => {
            msg.delete(4000)
        })

    //header details
    var options = {
        method: 'GET',
        url: process.env.RAPID_API_URL,
        headers:
        {
            "x-rapidapi-host": process.env.RAPID_API_HOST,
            "x-rapidapi-key": process.env.RAPID_API_KEY
        },
        qs:
        {
            "q": msg_title
        }
    };

   //fetch song details
    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        let meta = JSON.parse(body)
        let hits = meta.response.hits

        //write serverlist
        let data = JSON.stringify(meta);
        fs.writeFileSync('./_json/test.json', data);

        //put every hit in an Array
        let hit = []
        for (i in hits) {
            hit.push(hits[i].result.title)
        }

        //go through each hit and check if any of the input matches the title
        let titleArr = []
        let songTitle, songTitle2, songID, songURL, t
        hit.forEach(function (songTitle, i) {
            t = functions.capitalize(songTitle)
            titleArr = functions.string_to_array(t)
            if (functions.containsAny(titleArr, messageArr) === true) {
                //set variables
                songTitle2 = hits[i].result.full_title
                songID = hits[i].result.id
                songURL = hits[i].result.url
            }
        });
      
       //if no match, send message
        if (!songTitle2 && !songID && !songURL) {
            return message.channel.send("⚠ " + msg_title + " wasn't found! Try reprhasing it...")
                .then(msg => {
                    msg.delete(4000)
                })
        }

        // console.log(songTitle2)
        // console.log(songID)
        console.log(songURL)

        if(typeof songURL == undefined){
          return message.channel.send("Can't find song.")
        }
      
        //create embed_mgs
        let bad_embed = new Discord.RichEmbed()
            .setTimestamp()
            .setDescription("⚠ Deprecated! Please use `_scan [song title + artist]`")
            .setFooter(client.user.username, client.user.avatarURL)


        const url = songURL;

        rp(url)
            .then(function (html) {

                //fetch lyrics from website Genius!
                let lyricsText = $('.lyrics > p', html).text()
                let lyricsRep1 = lyricsText.replace(/\n/g, ' ').trim()
                let lyricsRep2 = lyricsRep1.replace(/[&\/\\#,+()$~%.":*?<>{}]/g, ' ').trim().toLowerCase()
                let lyricsArr = functions.string_to_array(lyricsRep2)
                let badwords = JSON.parse(fs.readFileSync("./_json/badword_list.json", "utf8"))

                // write results
                let d1 = JSON.stringify(lyricsRep2);
                fs.writeFileSync('./_json/lyrics_text.json', d1);

                // write results
                let d2 = JSON.stringify(lyricsArr);
                fs.writeFileSync('./_json/lyrics_array.json', d2);

                // console.log(lyricsArr)
                // console.log(functions.containsAny(lyricsArr, badwords))
                // console.log(_.intersection(lyricsArr, badwords))

                //Get all the bad words from the Lyrics
                let badwordArr = _.intersection(lyricsArr, badwords)

                //Create a nice Array of bad words, ready for embed_mgs
                let badArr = []
                badwordArr.forEach(function (element) {
                    let msg_cap = functions.capitalize(element)
                    badArr.push(msg_cap)
                });
                let badwordss = badArr.toString().replace(/[&\/\\#,+()$~%.":*?<>{}]/g, ', ').trim()

                //if there are bad songs, send message with words.
                if (functions.containsAny(lyricsArr, badwords) === true) {

                    bad_embed.setTitle("❌ This song is not PG!")
                    bad_embed.addField(songTitle2, "Words found:\n > " + badwordss + "\n" + songURL)
                    bad_embed.setColor(defaultconfig.embed_color_bad)
                    bad_embed.setThumbnail(defaultconfig.embed_img_bad)

                    message.channel.send(bad_embed)
                } else {

                    bad_embed.setTitle("✅ This song is clean!")
                    bad_embed.addField(songTitle2, songURL)
                    bad_embed.setColor(defaultconfig.embed_color_good)
                    bad_embed.setThumbnail(defaultconfig.embed_img_good)

                    message.channel.send(bad_embed)
                }

            })

            .catch(function (err) {
                console.log("rp error msg: " + err)
            });

    });

}

module.exports.help = {
    name: "check"
}