const keys = require('./keys.json')
const port = 5000;
const baseURL = `http://localhost:${port}`
const mongoURL = 'mongodb://localhost:27017/AppAvengers'

module.exports = {
    extensionSecret : 'piedpipercoin',
    jwtSecret : 'deadsimplesecret',
    port, baseURL, mongoURL,
    authCred : {
        clientId : keys.web.client_id,
        projectId : keys.web.project_id,
        authUri : keys.web.auth_uri,
        tokenUri : keys.web.token_uri,
        clientSecret : keys.web.client_secret,
        authProviderCertUrl : keys.web.auth_provider_x509_cert_url,
        redirectUris : keys.web.redirect_uris,
        scopes : [
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]
    }
}
