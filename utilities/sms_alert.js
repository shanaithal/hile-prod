var config = require('../config');
var twilio = require('twilio');
var twilioClient = new twilio.RestClient(config.twilio.account_sid, config.twilio.auth_token);
var User = require('../db/models/user');

var SMSClient = function () {

    return Object.create(SMSClient.prototype);
};

SMSClient.prototype.triggerAlert = function (buzz) {

    var smsBody = buzz.buzzer_mail + " has buzzed your product. Please find the contact: ";
    var smsBodyToBuzzer = "You've buzzed the product: ";
    User.findById(buzz.product_owner_id, function (err, user) {
        if (err) {

            console.log(err);
        } else {
            var userContact = user.contact;
            var buzzerContact = "+" + buzz.buzzer_contact;

            if (userContact.toString().length === 12) {

                userContact = "+" + userContact;
            }
            smsBody = smsBody + user.contact;
            var smsBodyToAdmin = "Buzzer email: " + buzz.buzzer_mail + " contact: " + buzz.buzzer_contact + " product id: " + buzz.product_id + " owner contact: " + buzz.userContact;
            twilioClient.sms.messages.create({

                to: "+" + config.smsAlertNumbers[0],
                from: config.twilio.from_number,
                body: smsBodyToAdmin
            }, function (err, message) {

                if (err) {

                    console.log('Could not send SMS alert' + JSON.stringify(err));
                } else {

                    console.log('SMS alert with message id ' + message.sid + " sent to " + config.smsAlertNumbers[0] + " at " + message.dateCreated);
                    smsBodyToBuzzer + buzz.product_id + " with owner: " + user.email + " contact: " + userContact;
                    twilioClient.sms.messages.create({

                        to: buzzerContact,
                        from: config.twilio.from_number,
                        body: smsBodyToBuzzer
                    }, function (err, message) {

                        if (err) {

                            console.log('Could not send SMS alert' + JSON.stringify(err));
                        } else {

                            config.smsAlertNumbers.forEach(function (element, index) {

                                    		twilioClient.sms.messages.create({
                                        			to: "+" + element,
                                    			from: config.twilio.from_number,
                                    			body: smsBodyToAdmin
                                		}, function (err, message) {

                                        			if (err) {

                                            				console.log('Could not send SMS alert' + e);
                                        			} else {

                                            				console.log('SMS alert with message id ' + message.sid + " sent to " + element + " at " + message.dateCreated);
                                        			}
                                    		})
                                	});
                            console.log('SMS alert with message id ' + message.sid + " sent to " + buzzerContact + " at " + message.dateCreated);
                        }
                    });
                }
            });
        }
    });
};

module.exports = SMSClient;
