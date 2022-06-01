const express = require('express');
const router = express.Router();
const { 
    getUserVideos, getLoginLink, handleCallback, saveVideo, removeVideo, getUser 
} = require('./controllers');

router.get('/login-link', getLoginLink);
router.get('/callback', handleCallback);
router.get('/videos', getUserVideos);
router.get('/save', saveVideo);
router.get('/remove', removeVideo);
router.get('/user', getUser);

module.exports = router;