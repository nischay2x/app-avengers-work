const mongoURL = 'mongodb://localhost:27017/AppAvengers';
const port = 5000;
const CLIENT_ID = '883191f8bbf223daf825ae6832707ecb18a6210c';
const CLIENT_SECRET = 'ttVrbo/RG1z5dDmm8qtsp1kf33iA/UxQRzY1PSPhOkqVD/oY4hMjmr0l0CgZDBN5rTv8iE2fbG5fC206yFWN0mpO1n1p4fw6zZ4AuYG982JC8S5j7wwBEjl9ZlLN4jIu';
const vimeoRedirect = 'http://localhost:5000/login-callback';
const vimeoScope = "public";
const vimeoState = "random-state";

module.exports = {
    mongoURL, port, CLIENT_ID, CLIENT_SECRET, vimeoRedirect,
    vimeoScope, vimeoState
}