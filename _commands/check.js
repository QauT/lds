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
        let titleArr = [], songID, song_api_url, songURL

        if (!hits[0].result.full_title) {
            return message.channel.send("No song found with this Title, try to adjust the title. Make sure to remove [official video] and other Youtube details. Just put the artist and the songs title.")
        }

        //set variables
        songTitle = hits[0].result.full_title
        songID = hits[0].result.id
        songAPIURL = hits[0].result.api_path
        songURL = hits[0].result.url

        console.log(songURL)

        //create embed_mgs
        let bad_embed = new Discord.RichEmbed()
            .setTitle("LYRICS " + songTitle)
            .setTimestamp()
            .setFooter(client.user.username, client.user.avatarURL)


        const url = songURL;

        rp(url)
            .then(function (html) {

                //fetch lyrics from website Genius!
                let lyricsText = $('.lyrics > p', html).text()
                let lyricsRep = lyricsText.replace(/\n/g, ' ').trim()
                let lyricsArr = functions.string_to_array(lyricsRep)
                let badwords = JSON.parse(fs.readFileSync("./_json/badword_list.json", "utf8"))

                // write results
                let d1 = JSON.stringify(lyricsRep);
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

                    bad_embed.setDescription("❌ Has the following bad words: \n > " + badwordss)
                    bad_embed.setColor(defaultconfig.embed_color_bad)
                    bad_embed.setThumbnail(defaultconfig.embed_img_bad)

                    message.channel.send(bad_embed)
                } else {

                    bad_embed.setDescription("✅ This song is clean!")
                    bad_embed.setColor(defaultconfig.embed_color_good)
                    bad_embed.setThumbnail(defaultconfig.embed_img_good)

                    message.channel.send(bad_embed)
                }

            })

            .catch(function (err) {
                console.log("rp error msg: " + err)
                message.channel.send("An Error Occured.")
            });




    });

}

module.exports.help = {
    name: "check"
}