var mongoose = require('mongoose');
var sub_categorySchema = new mongoose.Schema({

	name: {
		type: String
	},
	description: {
		type: String
	},
	category_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Category'
	}
});

sub_categorySchema.index({
	name: 1,
	category_id: 1
}, {
	unique: true
});

module.exports = mongoose.model('SubCategory', sub_categorySchema);
