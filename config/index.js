var config = {
	dbHost: "mongodb://prod:prod123@ds055485.mongolab.com:55485",
	databaseName: "heroku_cdd251z7",
	service_url: "http://hile.herokuapp.com/api",
	defaultSkip: 0,
	defaultLimit: 25,
	maxCount: 50,
	twilio: {
		account_sid: 'ACe21245ab7a9d40692353753534f1a13a',
		auth_token: '27e9e27ee5892277c0f5aa36c449f441',
		from_number: '+1 972-996-7229'
	},
	smsAlertNumbers: [
		918237392861
	]
};

module.exports = config;
