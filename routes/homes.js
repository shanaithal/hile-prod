var express = require('express');
var router = express.Router();
var connector = new require('../db/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();
var constants = require('../utilities/constants');

router.route('/homes')
    .post(function (request, response) {

        var homeObject = request.body;
        var validationError = Utility.validateInput(homeObject, constants.Home, constants.HTTP_POST);
        if (validationError !== null) {

            errorResponse.sendErrorResponse(response, 400, constants.BAD_REQUEST_ERROR, validationError);
        } else {

            var owner_mail = homeObject.owner_mail;
            if (Utility.isEmail(owner_mail)) {

                connector.createHome(function (err, location) {
                    if (err) {

                        response.status(err.code).json(err);
                    } else {

                        response.status(201).json(location);
                    }
                }, homeObject, constants.Email);
            } else {

                connector.createHome(function (err, location) {
                    if (err) {

                        response.status(err.code).json(err);
                    } else {

                        response.status(201).json(location);
                    }
                }, homeObject, constants.Id);
            }
        }
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
        var filters = Utility.getFilters(request.query);
        var paginationConfig = {};
        paginationConfig.skip = page;
        paginationConfig.limit = elementCount;

        connector.getHomes(function (err, homes) {
            if (err) {

                response.status(err.code).json(err);
            } else {

                if (homes.length > 0) {

                    connector.getCollectionCount(function (err, collectionSize) {

                        homes = Utility.getFormattedResponse(homes);
                        homes.data.collection_size = collectionSize;
                        if (collectionSize > elementCount) {
                            homes.data.pages = [];
                            var lastPage = collectionSize / elementCount;
                            if (page < lastPage) {

                                homes.data.pages.push(Utility.getNextPage(request.url, page + 1, elementCount));
                            }
                            if (page > 1) {

                                homes.data.pages.push(Utility.getPreviousPage(request.url, page - 1, elementCount));
                            }
                        }
                        response.status(200).json(homes);
                    }, constants.Home);
                } else {
                    errorResponse.sendErrorResponse(response, 404, constants.NOT_FOUND_ERROR, "There are no homes in the System.");
                }
            }
        }, filters, constants.Collection, paginationConfig, sort_config);
    });

router.route('/homes/:home_id')
    .put(function (request, response) {
        var homeObject = request.body;
        connector.updateHome(function (err, location) {
            if (err) {

                response.status(err.code).json(err);
            } else {

                response.status(204).json(location);
            }
        }, homeObject, request.params.home_id, "_id");
    })
    .get(function (request, response) {
        connector.getHomes(function (err, home) {
            if (err) {
                errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found");
            } else {

                if (home) {
                    response.statusCode = 200;
                    response.setHeader('content-type', 'application/json');
                    response.send(Utility.getFormattedResponse(home));
                } else {
                    errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found");
                }
            }
        }, {
            _id: request.params.home_id
        }, "_id");
    }).delete(function (request, response) {

    connector.deleteHome(function (err) {
        if (err) {
            errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The requested operation cannot be done.");
        } else {
            response.status(204).send();
        }
    }, request.params.home_id)
});

module.exports = router;