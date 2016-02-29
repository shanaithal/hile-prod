var config = require('../config');
var twilio = require('twilio');
var twilioClient = new twilio.RestClient(config.twilio.account_sid, config.twilio.auth_token);
var User = require('../db/models/user');

var SMSClient = function () {

    return Object.create(SMSClient.prototype);
}

SMSClient.prototype.triggerAlert = function (buzz) {

    var smsBody = buzz.buzzer_mail + " has buzzed your product. Please find the contact: ";
    var smsBodyToBuzzer = "You've buzzed the product: ";
    User.findOne({_id: buzz.product_owner_id.toString()}, function (err, user) {
        if (err) {

            console.log(err);
        } else {

            var smsBodyToAdmin = "User with email: " + buzz.buzzer_mail + " has buzzed " + buzz.product_id + " with owner: " + user.email;

            twilioClient.sms.messages.create({
                to: config.smsAlertNumbers[0],
                from: config.twilio.from_number,
                body: smsBody
            }, function (err, message) {

                if (err) {

                    console.log('Could not send SMS alert' + JSON.stringify(err));
                } else {

                    console.log('SMS alert with message id ' + message.sid + " sent to " + config.smsAlertNumbers[0] + " at " + message.dateCreated);
                }
            });
        }
    });
}

module.exports = SMSClient;
