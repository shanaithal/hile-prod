var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({

	name: {
		type: String
	},
	email: {
		type: String,
		index: true,
		unique: true
	},
	contact: {
		type: Number,
		unique: true,
		sparse: true
	},
	password: {
		type: String
	},
	rating: {
		type: Number,
		min: 0,
		max: 5,
		default: 0
	},
	userRole: {
		type: String
	},
	createdAt: {
		type: Date,
		default: Date.now()
	},
	local            : {
		email        : String,
		password     : String
	},
	google           : {
		id           : String,
		token        : String,
		email        : String,
		name         : String
	}
});

userSchema.index({
	name: "text",
	email: "text"
});

userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);
