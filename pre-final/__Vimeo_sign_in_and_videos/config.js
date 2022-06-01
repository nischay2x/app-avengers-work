const mongoURL = 'mongodb://localhost:27017/AppAvengers';
const port = 5000;
const CLIENT_ID = 'vimeo app client ID';
const CLIENT_SECRET = 'vimeo app client secret';
const vimeoRedirect = 'http://localhost:5000/login-callback';
const vimeoScope = "public";
const vimeoState = "random-state";

module.exports = {
    mongoURL, port, CLIENT_ID, CLIENT_SECRET, vimeoRedirect,
    vimeoScope, vimeoState
}