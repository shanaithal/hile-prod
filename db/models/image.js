var mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
	content: {
		type: String
	},
	content_type: {
		type: String
	},
	entity_type: {
		type: String
	},
	entity_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Product'
	},
	createdAt: {
		type: Date,
		default: Date.now()
	}
});

imageSchema.index({
	entity_type: 1,
	entity_id: 1
});

module.exports = mongoose.model('Image', imageSchema);