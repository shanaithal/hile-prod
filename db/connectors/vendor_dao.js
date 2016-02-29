var Vendor = require('../models/vendor');
var Utility = new require('../../utilities')();
var queryBuilder = new require('../../utilities/query_builder')();
var constants = require('../../utilities/constants');

var VendorDAO = function () {

    return Object.create(VendorDAO.prototype);
}

VendorDAO.prototype.createVendor = function (vendorObject, callback) {

    var vendor = new Vendor(vendorObject);
    vendor.save(function (err, vendor) {
        if (err) {
            callback(err);
        } else {
            callback(null, Utility.getLocation(vendor._id, constants.Vendor, constants.Created, constants.Vendors));
        }
    });
};

VendorDAO.prototype.getVendors = function (filters, fetchType, paginationConfig, sortConfig, callback) {

    switch (fetchType) {
        case constants.Collection:
            var query = QueryBuilder.build(Vendor, filters, fieldsOmittedFromResponse, sort_config, pagination_config)
            query.exec(function (err, vendors) {
                if (err) {

                    callback(err);
                } else {

                    callback(null, vendors);
                }
            });
            break;
        case constants.Email:
            var query = QueryBuilder.build(Vendor, {
                vendor_email: new RegExp('^' + filters.vendor_email + '$', "i")
            }, fieldsOmittedFromResponse);
            query.exec(function (err, vendor) {
                if (err) {
                    if (err.code === 11000) {
                        if (String(err.errmsg).match(constants.Contact)) {

                            callback({
                                code: 409,
                                message: constants.CONFLICT_ERROR,
                                description: "The vendor with specified contact already exists in the system."
                            });
                        } else if (String(err.errmsg).match(constants.Email)) {

                            callback({
                                code: 409,
                                message: constants.CONFLICT_ERROR,
                                description: "The vendor with specified email already exists in the system."
                            });
                        }
                    } else {

                        console.log(err);
                        callback({
                            code: 500,
                            message: constants.INTERNAL_SERVER_ERROR,
                            description: "Unknown DB error occurred"
                        });
                    }
                } else {

                    callback(null, vendor);
                }
            });
            break;
        case constants.Id:
            var query = QueryBuilder.build(Vendor, {_id: filters._id}, fieldsOmittedFromResponse);
            query.exec(function (err, vendor) {
                if (err) {

                    callback(err);
                    callback({
                        code: 500,
                        message: constants.INTERNAL_SERVER_ERROR,
                        description: "Unknown DB error occurred"
                    });
                } else {

                    callback(null, vendor);
                }
            });
            break;
    }
};
module.exports = VendorDAO;