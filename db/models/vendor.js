var mongoose = require('mongoose');

var vendorSchema = new mongoose.Schema({
    vendor_name: {
        type: String
    },
    vendor_email: {
        type: String
    },
    vendor_contact: {
        type: Number
    },
    vendor_address: {
        type: mongoose.Schema.Types,
        ref: 'Location'
    },
    //community_name:
});

module.exports = mongoose.model('Vendor', vendorSchema);
