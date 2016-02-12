var mongoose = require('mongoose');

var reviewSchema = mongoose.Schema({

	reviewer_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	reviewer_name: {
		type: String
	},
	subject: {
		type: String
	},
	comment: {
		type: String
	},
	rating: {
		type: Number,
		min: 1,
		max: 5
	},
	product_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Product'
	},
	createdAt: {
		type: Date,
		default: Date.now()
	}
});

reviewSchema.index({
	reviewer_id: 1,
	reviewer_name: 1,
	subject: 1,
	product_id: 1
});

module.exports = mongoose.model('Review', reviewSchema);
