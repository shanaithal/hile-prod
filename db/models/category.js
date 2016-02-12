var mongoose = require('mongoose');

var categorySchema = mongoose.Schema({

	name: {
		type: String,
		index: true,
		unique: true
	},
	description: {
		type: String
	},
	createdAt: {
		type: Date,
		default: Date.now()
	}
});

module.exports = mongoose.model('Category', categorySchema);
