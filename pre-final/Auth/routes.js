const express = require('express');
const { getNonceToSign, verifySignedMessage } = require('./controllers');
const router = express.Router();

router.post("/address", getNonceToSign);
router.post("/verify", verifySignedMessage);

module.exports = router;