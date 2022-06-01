const yt = require('./youtubeKeys.json').web;
module.exports = {
    MONGO_URL : "mongodb://localhost:27017/AppAvengersPre",
    PORT : 5000,
    jwtSecret : "natural-selection",
    jwtYtSecret : "not-crazy-oppsite",
    collectionTokenSecret : "you-see-lot-of-faces-everyday-pal",
    yt : {
        clientId : yt.client_id,
        projectId : yt.project_id,
        authUri : yt.auth_uri,
        tokenUri : yt.token_uri,
        clientSecret : yt.client_secret,
        authProviderCertUrl : yt.auth_provider_x509_cert_url,
        redirectUris : yt.redirect_uris,
        scopes : [
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]
    }
}