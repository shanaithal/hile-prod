var nodemailer = require('nodemailer');
var fs = require('fs');
var _jade = require('jade');

// Configuration file to import the app Specific Password and sender mail
var config = require('../config');

// DB model of users
var User = require('../db/models/user');
var Product = require('../db/models/product');

// Creating transport object with authentication and services
var transport = nodemailer.createTransport({
     // in case it is a well known service you can simply name it. No need of host and ports
     // to see the list of well known services you can visit https://github.com/nodemailer/nodemailer-wellknown#supported-services
    service: 'gmail',
    auth: {
        user: config.mailAlert.senderMail,
        pass: config.mailAlert.appSpecificPassword // this should be the Application Specific Password else it wont work
    }
});

var MAILClient = function () {
    return Object.create(MAILClient.prototype);
};

MAILClient.prototype.triggerMail = function (buzz) {

    Product.findById(buzz.product_id, function (err, product) {
        if (err) {
            console.log(err);
        } else {

            // specify jade template to load

            // for windows system
            var template = __dirname + '\\views\\buzz_template.jade';

            // for linux system
            // var template = __dirname + '/views/buzz_template.jade';

            // get template from file system
            fs.readFile(template, 'utf8', function(err, file){
                if(err){
                    //handle errors
                    console.log('ERROR in reading template');
                }
                else {
                    //compile jade template into function
                    var compiledTmpl = _jade.compile(file, {filename: template});
                    // set context to be used in template
                    var buzzer_context = {locals: {content: 'Hey there'}};

                    var buzzer_context = {content: 'Thanks for using Hile. You were interested in ' + product.name + '\
                     from ' + buzz.home_name + '. Let us check with the service provider and get \
                    back to you. Our No: +91-8237392861'};

                    var buzzed_context = {content: 'Hi, greetings from Hile. Great news! Your product: ' + product.name + '\
                     has been buzzed from ' + buzz.buzzer_mail + '. We will get in touch to give you more details'};

                    var admin_context = {content: 'Hello Admin product ' + product.name + ': ' + buzz.product_id + ' has been \
                    buzzed by ' + buzz.buzzer_mail + ' and owner is ' + product.owner_mail + '  \
                    check all here https://hile.herokuapp.com/api/buzzes'};

                    // get html back as a string with the context applied;
                    var buzzer_html = compiledTmpl(buzzer_context);
                    var buzzed_html = compiledTmpl(buzzed_context);
                    var admin_html = compiledTmpl(admin_context);

                    var buzzer_mail = buzz.buzzer_mail;
                    var admin_mail = 'suryadeep10@gmail.com';
                    var buzzed_user_mail = product.owner_mail;

                    // for sending mail to the buzzer
                    transport.sendMail({
                        from: config.mailAlert.senderMail,
                        to: buzzer_mail,
                        subject: 'You have buzzed someone!',
                        html: buzzer_html
                    }, function (err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(info);
                        }
                    });

                    // for sending mail to the buzzed person
                    transport.sendMail({
                        from: config.mailAlert.senderMail,
                        to: buzzed_user_mail,
                        subject: 'You have been buzzed!',
                        html: buzzed_html
                    }, function (err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(info);
                        }
                    });

                    // for sending mail to the admin
                    transport.sendMail({
                        from: config.mailAlert.senderMail,
                        to: admin_mail,
                        subject: 'New Buzz!',
                        html: admin_html
                    }, function (err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(info);
                        }
                    });
                }
            });
        }
    })
}

module.exports = MAILClient;
