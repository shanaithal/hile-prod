var express = require('express');
var router = express.Router();
var connector = new require('../utilities/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();

router.route('/vendors')
    .post(function (request, response) {
        var vendorObject = request.body;
            connector.createVendor(function (err, location) {
                if (err) {
                    errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "Could not Create the Vendor");
                } else {
                    response.statusCode = 201;
                    response.send(location);
                }
            }, vendorObject);
    })
    .get(function (request, response) {
        var page = parseInt(request.query.page);
        var elementCount = parseInt(request.query.count);
        var sort_params = request.query.sortby;
        var sort_order = request.query.order;
        if (!Utility.isArray(sort_params)) {
            sort_params = [sort_params];
        }
        var sort_config = {sort_params: sort_params, order: sort_order};
        var filters = Utility._getFilters(request.query);
        var paginationConfig = {};
        paginationConfig.skip = page;
        paginationConfig.limit = elementCount;
        connector.getVendors(function (err, vendors) {
            if (err) {
                errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "Could not fetch vendors.");
            } else {
                if (vendors.length > 0) {
                    connector.getCollectionCount(function (err, collectionSize) {

                        vendors = Utility.getFormattedResponse(vendors);
                        vendors.data.collection_size = collectionSize;
                        if (collectionSize > elementCount) {
                            vendors.data.pages = [];
                            var lastPage = collectionSize / elementCount;
                            if (page < lastPage) {
                                vendors.data.pages.push(Utility.getNextPage(request.url, page + 1, elementCount));
                            }
                            if (page > 1) {
                                vendors.data.pages.push(Utility.getPreviousPage(request.url, page - 1, elementCount));
                            }
                        }
                        response.status(200).json(vendors);
                    }, "vendor");
                } else {
                    errorResponse.sendErrorResponse(response, 404, "Not Found", "There are no vendors in the System");
                }
            }
        }, filters, "collection", paginationConfig, sort_config);
    });

router.route('/vendors/:vendor_id')
    .get(function (request, response) {
    var vendor_id = request.params.vendor_id;
    var emailPattern = /^.*@.*\..*/;
    if (emailPattern.test(vendor_id)) {
        connector.getVendors(function (err, vendor) {
            if (err) {
                errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
            } else {
                if (vendor) {
                    response.status(200).json(Utility.getFormattedResponse(vendor));
                } else {
                    errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
                }
            }
        }, {
            vendor_email: vendor_id
        }, "email");
    } else {
        connector.getVendors(function (err, vendor) {
            if (err) {
                errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
            } else {
                if (vendor) {
                    response.status(200).json(Utility.getFormattedResponse(vendor));
                } else {
                    errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
                }
            }
        }, {
            _id: vendor_id
        }, "_id");
    }
})
module.exports = router;