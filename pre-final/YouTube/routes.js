const express = require('express');
const router = express.Router();

const { 
    checkQueryParams, authenticateToken, 
    verifySingleUpdate, verifyMultipleUpdate
} = require('./middleware');

const { 
    getLoginLink, handleLoginCallback, getVideos, 
    getVideoById, refreshList, listMultipleVideos, 
    unlistMultipleVideos, listVideo, unlistVideo 
} = require('./controllers');

router.get('/login-link', getLoginLink);
router.get('/login-callback', checkQueryParams, handleLoginCallback);
router.get('/videos', authenticateToken, getVideos);
router.get('/video/:videoId', authenticateToken, getVideoById);
router.get('/refresh', authenticateToken, refreshList);
router.post('/save', authenticateToken, verifySingleUpdate, listVideo);
router.post('/save-multiple', authenticateToken, verifyMultipleUpdate, listMultipleVideos );
router.post('/remove', authenticateToken, verifySingleUpdate, unlistVideo);
router.post('/remove-multiple', authenticateToken, verifyMultipleUpdate, unlistMultipleVideos);

module.exports = router;