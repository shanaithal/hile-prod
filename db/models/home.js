var mongoose = require('mongoose');
var Location = require('./location');

var homeSchema = new mongoose.Schema({

	name: {
		type: String
	},
	location: {
		type: mongoose.Schema.Types,
		ref: 'Location'
	},
	owner_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	owner_mail: {
		type: String
	},
	home_type: {
		type: String
	},
	community_name: {
		type: String
	},
	createdAt: {
		type: Date,
		default: Date.now()
	}
});

homeSchema.index({
	name: 1,
	owner_mail: 1
}, {
	unique: true
});

homeSchema.index({
	name: "text",
	owner_mail: "text",
	location: "text"
});

module.exports = mongoose.model('Home', homeSchema);
