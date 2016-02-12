var mongoose = require('mongoose');

var productSchema = mongoose.Schema({

	name: {
		type: String
	},
	description: {
		type: String
	},
	category_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Category'
	},
	category_name: {
		type: String
	},
	sub_category_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'SubCategory'
	},
	sub_category_name: {
		type: String
	},
	home_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Home'
	},
	home_name: {
		type: String
	},
	owner_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	owner_mail: {
		type: String
	},
	rent_rate: {
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
	owned_from_months: {
		type: Number
	},
	quantity: {
		type: Number
	},
	rent_per_day: {
		type: Number
	},
	rent_per_week: {
		type: Number
	},
	rent_per_month: {
		type: Number
	},
	available: {
		from: {
			type: Date
		},
		to: {
			type: Date
		}
	},
	order_by: {
		type: String
	},
	rate_per_min_serve: {
		type: Number
	},
	time_of_the_day_for_order: {
		type: String
	},
	days_of_the_week_for_order: {
		type: Array
	},
	willing_to_teach_outside:{
		type: Boolean
	},
	pre_requirements:{
		type: String
	},
	createdAt: {
		type: Date,
		default: Date.now()
	},
	isAvailable: {
		type: Boolean
	}
});

productSchema.index({
		name: 1,
		owner_mail: 1,
		home_name: 1
	},
	{
		unique: true
	});
productSchema.index({
	name: "text",
	description: "text",
	category_name: "text",
	sub_category_name: "text",
	home_name: "text",
	owner_mail: "text"
});

module.exports = mongoose.model('Product', productSchema);
