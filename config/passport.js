var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User = require('../db/models/user');
var configAuth = require('./auth');

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, email, password, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function () {
                User.findOne({'email': email}, function (err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, {message: 'User not found'});

                    if (!user.validPassword(password))
                        return done(null, false, {message: 'Oops! Wrong password.'});

                    // all is well, return user
                    else
                        return done(null, user);
                });
            });

        }));

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            allowEmptyPasswords: true,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, email, password, done) {

            console.log("Hello");
            var username = req.body.name;
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function () {
                // if the user is not already logged in:
                if (!req.user) {
                    User.findOne({'email': email}, function (err, user) {
                        if (err)
                            return done(err);

                        if (user) {

                            user.email = email;
                            user.name = username;
                            user.local.email = email;
                            if (password !== undefined) {
                                user.local.password = user.generateHash(password);
                            }
                            user.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                return done(null, user);
                            });
                        } else {

                            // create the user
                            var newUser = new User();

                            newUser.name = username;
                            newUser.email = email;
                            newUser.local.email = email;
                            if (password !== undefined) {
                                newUser.local.password = newUser.generateHash(password);
                            }

                            newUser.save(function (err) {
                                if (err){
                                    return done(err);
                                }
                                return done(null, newUser);
                            });
                        }

                    });
                } else if (!req.user.local.email) {

                    User.findOne({'local.email': email}, function (err, user) {
                        if (err)
                            return done(err);

                        if (user) {
                            return done(null, false, {message: 'That email is already taken.'});
                            // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                        } else {
                            var user = req.user;
                            user.local.email = email;
                            user.local.password = user.generateHash(password);
                            user.save(function (err) {
                                if (err){
                                    return done(err);
                                }

                                return done(null, user);
                            });
                        }
                    });
                } else {
                    // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                    return done(null, req.user);
                }

            });

        }));

    passport.use(new GoogleStrategy({

            clientID: configAuth.googleAuth.clientID,
            clientSecret: configAuth.googleAuth.clientSecret,
            callbackURL: configAuth.googleAuth.callbackURL,
            passReqToCallback: true

        },
        function (req, token, refreshToken, profile, done) {

            process.nextTick(function () {

                // check if the user is already logged in
                if (!req.user) {

                    User.findOne({email: (profile.emails[0].value || '').toLowerCase()}, function (err, user) {
                        if (err)
                            return done(err);

                        if (user) {

                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.google.token) {
                                user.google.token = token;
                                user.google.name = profile.displayName;
                                user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                                user.save(function (err) {
                                    if (err)
                                        return done(err);

                                    return done(null, user);
                                });
                            }

                            return done(null, user);
                        } else {
                            var newUser = new User();

                            newUser.email = (profile.emails[0].value || '').toLowerCase();
                            newUser.name = profile.displayName;
                            newUser.google.id = profile.id;
                            newUser.google.token = token;
                            newUser.google.name = profile.displayName;
                            newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                            newUser.save(function (err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });
                        }
                    });

                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user = req.user; // pull the user out of the session

                    user.google.id = profile.id;
                    user.google.token = token;
                    user.google.name = profile.displayName;
                    user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                    user.save(function (err) {
                        if (err)
                            return done(err);

                        return done(null, user);
                    });

                }

            });

        }));

};