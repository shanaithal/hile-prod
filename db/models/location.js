var mongoose = require('mongoose');

var locationSchema = new mongoose.Schema({

	address1: String,
	address2: String,
	community_name: String,
	town: String,
	state: String,
	pincode: Number
});

module.exports = mongoose.model('Location', locationSchema);
