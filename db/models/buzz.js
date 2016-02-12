var mongoose = require('mongoose');

var buzzSchema = mongoose.Schema({

	buzzer_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	buzzer_mail: {
		type: String
	},
	buzzer_contact: {
		type: Number
	},
	time_preference: {
		start: {
			type: Date
		},
		end: {
			type: Date
		}
	},
	negotiation_price: {
		type: Number
	},
	product_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Product'
	},
	product_owner_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	buzzedAt: {
		type: Date,
		default: Date.now()
	},
	status: {
		type: String
	}
});

buzzSchema.index({
	buzzer_name: "text"

});

module.exports = mongoose.model('Buzz', buzzSchema);
