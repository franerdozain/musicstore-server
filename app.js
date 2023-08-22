const db = require('./db')
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true, // Enables sending cookies and other credentials
  }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


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
