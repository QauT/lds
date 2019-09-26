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


    //// Message Handler => ////

    //remove officials from title
    let input = args.toString().replace(/[&\/\\#,+()$~%":*?<>{}]/g, ' ').trim()
    let officialsToRemove = JSON.parse(fs.readFileSync("./_json/officials.json", "utf8"))
    let remove_title = input.toLowerCase()
    officialsToRemove.forEach((remove) => {
        if (remove_title.includes(remove.toLowerCase())) {
            remove_title = remove_title.replace(remove, ' ').trim();
        }
    })

    //title for embedded message
    let input_title = functions.capitalize(remove_title)

    //get every inputted word capitalized and uppercased
    let messageArr_Up = []
    let messageArr_Cap = functions.string_to_array(input_title)
    messageArr_Cap.forEach(function (input) {
        messageArr_Up.push(input.toUpperCase().replace(/[&\/\\#,+()$~%.":*?<>{}]/g, ' ').trim())
    })

    //fetching message to User
    message.channel.send("Checking lyrics for " + input_title + "...")
        .then(msg => {
            msg.delete(2000)
        })


    //// API Handler => ////

    //header details
    var options = {
        method: 'GET',
        url: process.env.RAPID_API_URL,
        headers:
        {
            "x-rapidapi-host": process.env.RAPID_API_HOST,
            "x-rapidapi-key": process.env.RAPID_API_KEY
        },
        qs: { "q": input_title }
    };

    //fetch song details
    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        //construct main array variables
        let meta = JSON.parse(body)
        let hits = meta.response.hits

        //write serverlist
        let data = JSON.stringify(meta);
        fs.writeFileSync('./_json/test.json', data);

        //// Data processor => ////

        //go through all the Genius API data and 
        let resultArr = []
        for (i in hits) {
            let hit = hits[i]
            let songTitle = hit.result.title
            let artistName = hit.result.primary_artist.name

            let TitleName = songTitle.toUpperCase() + " " + artistName.toUpperCase()
            let TitleNameArr = functions.string_to_array(TitleName)

            //check if title contains any of the input
            let songID, songURL
            if (functions.containsAny(TitleNameArr, messageArr_Up) === true) {
                artistName = hit.result.primary_artist.name
                songTitle = hit.result.title
                songID = hit.result.id
                songURL = hit.result.url
            }
            resultArr.push({ songID, songURL, songTitle, artistName })
        }

        //filters checked titles to remove commentary, mixes, playlist(s), etc.
        let songID, songURL, songTitle, artistName
        var filtered = resultArr.filter(function (value, index, arr) {
            if (value.songID && value.songURL !== "undefined") {
                // console.log(index + value.songID + value.songURL)

                let filtered_url = value.songURL.lastIndexOf('/')
                let filtered_result = value.songURL.substring(filtered_url + 1)
                let filtered_title = filtered_result.toLowerCase().replace(/[&\/\\#,+()$~%."-:*?<>{}]/g, ' ').trim()

                let filtered_titleArr = functions.string_to_array(filtered_title)
                let checkList = JSON.parse(fs.readFileSync("./_json/checklist.json", "utf8"))
                if (functions.containsAny(filtered_titleArr, checkList) === false) {
                    songID = value.songID
                    songURL = value.songURL
                    songTitle = value.songTitle
                    artistName = value.artistName
                }

            }
        });

        console.log(songTitle + " - " + artistName + " | " + songID + " | " + songURL)

        //Check if there is a match
        if (!songTitle && !artistName && !songID && !songURL) {
            return message.channel.send("⚠ " + input_title + " wasn't found! Try reprhasing it...")
                .then(msg => {
                    msg.delete(4000)
                })
        }

        //create embed_mgs
        let scanMessage_embed = new Discord.RichEmbed()
            .setTimestamp()
            .setFooter(client.user.username, client.user.avatarURL)

        //// Web Scraping => ////
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

                    scanMessage_embed.setTitle("❌ This song is not PG!")
                    scanMessage_embed.addField(`${songTitle} by ${artistName}`, "Words found:\n > " + badwordss + "\n" + songURL)
                    scanMessage_embed.setColor(defaultconfig.embed_color_bad)
                    scanMessage_embed.setThumbnail(defaultconfig.embed_img_bad)

                    message.channel.send(scanMessage_embed)
                } else {

                    scanMessage_embed.setTitle("✅ This song is clean!")
                    scanMessage_embed.addField(`${songTitle} by ${artistName}`, songURL)
                    scanMessage_embed.setColor(defaultconfig.embed_color_good)
                    scanMessage_embed.setThumbnail(defaultconfig.embed_img_good)

                    message.channel.send(scanMessage_embed)
                }

            })

            .catch(function (err) {
                if (err.lenght > 100) {
                    console.log("Webscraper error msg.")
                } else {
                    console.log("Webscraper error msg: " + err)
                }
            });

    });


}

module.exports.help = {
    name: "scan"
}