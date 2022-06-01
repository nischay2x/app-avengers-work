const express = require('express');
const app = express();
const CONFIG = require('./config.js');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoute = require('./Auth/routes.js');
const userRoute = require('./User/routes.js');

app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoute);
app.use('/user', userRoute);

mongoose.connect(CONFIG.MONGO_URL, (err) => {
    if(err) console.log(err)
    else app.listen(CONFIG.PORT, (err) => {
        if(err) console.log(err)
        else console.log(`Server runing at ${CONFIG.PORT}`)
    })
});