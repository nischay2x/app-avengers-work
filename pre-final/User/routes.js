const express = require('express');
const router = express.Router();

const {
    authenticateToken
} = require('./middleware.js');

const { 
    getSignedUser, getUser, updateUsername, 
    updateProfile, updateLinks 
} = require('./controllers.js');

router.get("/profile", authenticateToken, getSignedUser);
router.get("/profile/:username", getUser);
router.patch("/username", authenticateToken, updateUsername);
router.patch("/profile", authenticateToken, updateProfile);
router.patch("/links", authenticateToken, updateLinks);


module.exports = router;