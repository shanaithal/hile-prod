var express = require('express');
var cors = require('cors');
var logger = require('morgan');
var bodyParser = require('body-parser');
var PORT = process.env.PORT || 3000;

var app = new express();

var passport = require('passport')
var session = require('express-session');
var cookieParser = require('cookie-parser');

require('./config/passport')(passport);

app.use(cookieParser());
app.use(session({secret: 'secretekey'}));
app.use(passport.initialize());
app.use(passport.session());

app.use(new cors());
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/app'));
app.get('/', function (request, response) {
    response.render('./app/index.html');
});

app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: '/loginfail',
    failureFlash: false
}));

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/signupfail',
    allowEmptyPasswords: false,
    failureFlash: false
}));

app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/loginfail'
    }));

app.get('/loginfail', function (request, response) {

    response.status(401).json({code: 401, message: "Not Authorised", description: "The user is not authenticated."});
});

app.get('/signupfail', function (request, response) {

   response.status(500).json({code: 500, message: "Internal Server Errror", description: "The user could not be added to the system"});
});

app.use('/api', require('./routes/index'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/homes'));
app.use('/api', require('./routes/categories'));
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/buzzes'));
app.use('/api', require('./routes/search'));
app.use('/api', require('./routes/images'));
app.use('/api', require('./routes/vendors'));

app.listen(PORT);

console.log("Server running at: " + PORT);
