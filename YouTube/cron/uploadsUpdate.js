const cron = require('node-cron')
const Users  = require('../models/user-channels.js')

const google = require('googleapis').google
const oAuth2 = google.auth.OAuth2
const CONFIG = require('../config.js')
const youtube = google.youtube("v3")

const task = cron.schedule("*/8 * * * * *", async () => {
    const users = await Users.find({}, { userId : 1, access : 1, channel : 1 })
    users.forEach(user => { updater(user) })
})

module.exports = task

async function updater(user) {
    const oauth2Client = new oAuth2(
        CONFIG.authCred.clientId,
        CONFIG.authCred.clientSecret,
        CONFIG.authCred.redirectUris
    );
    oauth2Client.credentials = user.access

    const channelResponse = await youtube.channels.list({
        auth: oauth2Client,
        mine: true,
        part: 'id, contentDetails, snippet, statistics',
        maxResults: 1
    })
    const channelData = channelResponse.data.items[0]

    await Users.findOneAndUpdate({ userId: user.userId }, {
        channel: channelData
    })

    if (user.channel.statistics.videoCount !== channelData.statistics.videoCount) {
        const listitemResponse = await youtube.playlistItems.list({
            auth: oauth2Client,
            playlistId: channelData.contentDetails.relatedPlaylists.uploads,
            part: 'snippet, contentDetails, id',
            maxResults: channelData.statistics.videoCount
        })

        const userUploads = listitemResponse.data.items.map(item => {
            return ({
                id: item.id,
                snippet: {
                    publishedAt: item.snippet.publishedAt,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnails: item.snippet.thumbnails
                },
                contentDetails: item.contentDetails,
            })
        })

        await Users.findOneAndUpdate({ userId: user.userId }, {
            uploads: userUploads
        })
        console.log(user.userId, "Upload List Updated"); 
    }
}