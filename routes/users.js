var express = require('express');
var router = express.Router();
var connector = new require('../db/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();
var constants = require('../utilities/constants');

router.route('/users')
    .post(function (request, response) {
        var userObject = request.body;
        var validationError = Utility.validateInput(userObject, constants.User, constants.HTTP_POST);
        if (validationError !== null) {

            errorResponse.sendErrorResponse(response, 400, constants.BAD_REQUEST_ERROR, validationError);
        } else {
            connector.createUser(function (err, location) {
                if (err) {

                    response.status(err.code).json(err);
                } else {

                    response.status(201).json(location);
                }
            }, userObject);
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
        connector.getUsers(function (err, users) {
            if (err) {

                response.status(err.code).json(err);
            } else {

                if (users.length > 0) {
                    connector.getCollectionCount(function (err, collectionSize) {

                        users = Utility.getFormattedResponse(users);
                        users.data.collection_size = collectionSize;
                        if (collectionSize > elementCount) {
                            users.data.pages = [];
                            var lastPage = collectionSize / elementCount;
                            if (page < lastPage) {
                                users.data.pages.push(Utility.getNextPage(request.url, page + 1, elementCount));
                            }
                            if (page > 1) {
                                users.data.pages.push(Utility.getPreviousPage(request.url, page - 1, elementCount));
                            }
                        }
                        response.status(200).json(users);
                    }, constants.User);
                } else {
                    errorResponse.sendErrorResponse(response, 404, constants.NOT_FOUND_ERROR, "There are no users in the System");
                }
            }
        }, filters, constants.Collection, paginationConfig, sort_config);
    });

router.route('/users/:user_id')
    .put(function (request, response) {

        var user_id = request.params.user_id;
        var userObject = request.body;

        var validationError = Utility.validateInput(userObject, constants.User, constants.HTTP_PUT);
        console.log(validationError);
        if (validationError !== null) {

            errorResponse.sendErrorResponse(response, 400, constants.BAD_REQUEST_ERROR, validationError);
        } else {
            var emailPattern = /^.*@.*\..*/;
            if (emailPattern.test(user_id)) {
                connector.updateUser(function (err, location) {
                    if (err) {

                        response.status(err.code).json(err);
                    } else {

                        response.status(204).json(location);
                    }
                }, userObject, user_id, constants.Email);
            } else {

                connector.updateUser(function (err, location) {

                    if (err) {

                        response.status(err.code).json(err);
                    } else {

                        response.status(204).json(location);
                    }
                }, userObject, user_id, "_id");
            }
        }
    })
    .get(function (request, response) {
        var user_id = request.params.user_id;
        var emailPattern = /^.*@.*\..*/;
        if (emailPattern.test(user_id)) {
            connector.getUsers(function (err, user) {
                if (err) {
                    response.status(err.code).json(err);
                } else {
                    if (Utility.isArray(user)) {

                        user = user[0];
                    }
                    if (user.email !== undefined) {

                        response.status(200).json(Utility.getFormattedResponse(user));
                    } else {
                        errorResponse.sendErrorResponse(response, 404, constants.NOT_FOUND_ERROR, "The requested resource not found.");
                    }
                }
            }, {
                email: user_id
            }, constants.Email);
        } else {
            connector.getUsers(function (err, user) {
                if (err) {
                    response.status(err.code).json(err);
                } else {
                    if (Utility.isArray(user)) {

                        user = user[0];
                    }
                    if (user.email !== undefined) {

                        response.status(200).json(Utility.getFormattedResponse(user));
                    } else {
                        errorResponse.sendErrorResponse(response, 404, constants.NOT_FOUND_ERROR, "The requested resource not found.");
                    }
                }
            }, {
                _id: user_id
            }, constants.Id);
        }
    })
    .delete(function (request, response) {
        var user_id = request.params.user_id;
        var emailPattern = /^.*@.*\..*/;
        if (emailPattern.test(user_id)) {
            connector.deleteUser(function (err) {
                if (err) {
                    errorResponse.sendErrorResponse(response, 500, constants.INTERNAL_SERVER_ERROR, "The resource could not be deleted");
                } else {
                    response.status(204).end();
                }
            }, user_id, constants.Email);
        } else {
            connector.deleteUser(function (err) {
                if (err) {
                    response.status(err.code).json(err);
                } else {
                    response.status(204).end();
                }
            }, user_id, constants.Id);
        }

    });

router.route('/validate/user/:user_mail')
    .get(function (request, response) {

        var user_mail = request.params.user_mail;
        connector.getUsers(function (err, user) {
            if (err) {

                errorResponse.sendErrorResponse(response, 401, constants.UNAUTHORISED_ERROR, "The User is Invalid");
            } else {

                if (user !== undefined && JSON.stringify(user) !== '[]') {

                    errorResponse.sendErrorResponse(response, 200, constants.OK_STATUS, "The User is Valid");
                } else {

                    errorResponse.sendErrorResponse(response, 401, constants.UNAUTHORISED_ERROR, "The User is Invalid");
                }
            }
        }, {
            email: user_mail
        }, constants.Email);
    });

module.exports = router;