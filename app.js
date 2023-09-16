const db = require('./db');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');
const sessionKey = process.env.SESSION_KEY;
// const bodyParser = require('body-parser');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));


// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

app.use(session({
    secret: sessionKey,
    resave: false,
    saveUninitialized: false,
    maxAge: 1 * 60 * 1000,
    unset: 'destroy'
}));

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true, 
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const indexRouter = require('./routes/index');
app.use('/', indexRouter);

const port = process.env.PORT || 4000;

db.connect((err) => {
    if (err) {
        console.error('Database conection error: ', err);
    } else {
        console.log('Database succesfully conected ');
    }
});

app.listen(port, () => {
    console.log(`listening server on port: ${port}`);
});

module.exports = app;