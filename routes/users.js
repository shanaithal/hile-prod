var express = require('express');
var router = express.Router();
var connector = new require('../utilities/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();

function validUser(userObject) {

    var emailPattern = /^.*@.*\..*/;
    if (userObject.email.indexOf(" ") !== -1 || !emailPattern.test(userObject.email)) {

        return false;
    }

    return true;
}

router.route('/users')
    .post(function (request, response) {
        var userObject = request.body;
        if (!validUser(userObject)) {

            errorResponse.sendErrorResponse(response, 400, "Bad Request", "Invalid Payload");
        } else {
            connector.createUser(function (err, location) {
                if (err) {
                    errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "Could not Create the User");
                } else {
                    response.statusCode = 201;
                    response.send(location);
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
        var filters = Utility._getFilters(request.query);
        var paginationConfig = {};
        paginationConfig.skip = page;
        paginationConfig.limit = elementCount;
        connector.getUsers(function (err, users) {
            if (err) {
                errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "Could not fetch users.");
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
                    }, "user");
                } else {
                    errorResponse.sendErrorResponse(response, 404, "Not Found", "There are no users in the System");
                }
            }
        }, filters, "collection", paginationConfig, sort_config);
    });

router.route('/users/:user_id')
    .put(function (request, response) {

        var user_id = request.params.user_id;
        var userObject = request.body;

        var emailPattern = /^.*@.*\..*/;
        if (emailPattern.test(user_id)) {
            connector.updateUser(function (err, location) {
                if (err) {
                    errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "Could not update the User");
                } else {
                    response.status(200).json(location);
                }
            }, userObject, user_id, "email");
        } else {
            connector.updateUser(function (err, location) {
                if (err) {
                    errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "Could not update the User");
                } else {
                    response.statusCode = 200;
                    response.setHeader('content-type', 'application/json');
                    response.send(location);
                }
            }, userObject, user_id, "_id");
        }
    })
    .get(function (request, response) {
        var user_id = request.params.user_id;
        var emailPattern = /^.*@.*\..*/;
        if (emailPattern.test(user_id)) {
            connector.getUsers(function (err, user) {
                if (err) {
                    errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
                } else {
                    if (user) {
                        response.statusCode = 200;
                        response.setHeader('content-type', 'application/json');
                        response.send(Utility.getFormattedResponse(user));
                    } else {
                        errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
                    }
                }
            }, {
                email: user_id
            }, "email");
        } else {
            connector.getUsers(function (err, user) {
                if (err) {
                    errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
                } else {
                    if (user) {
                        response.statusCode = 200;
                        response.setHeader('content-type', 'application/json');
                        response.send(Utility.getFormattedResponse(user));
                    } else {
                        errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
                    }
                }
            }, {
                _id: user_id
            }, "_id");
        }
    }).delete(function (request, response) {
    var user_id = request.params.user_id;
    var emailPattern = /^.*@.*\..*/;
    if (emailPattern.test(user_id)) {
        connector.deleteUser(function (err) {
            if (err) {
                errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The resource could not be deleted");
            } else {
                response.statusCode = 204;
                response.end();
            }
        }, user_id, "email");
    } else {
        connector.deleteUser(function (err) {
            if (err) {
                errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The resource could not be deleted");
            } else {
                response.statusCode = 204;
                response.end();
            }
        }, user_id, "_id");
    }

});

router.route('/validate/user/:user_mail')
    .get(function (request, response) {

        var user_mail = request.params.user_mail;
        connector.getUsers(function (err, user) {
            if (err) {

                errorResponse.sendErrorResponse(response, 401, "Unauthorised", "The User is Invalid");
            } else {

                if (user !== undefined &&  JSON.stringify(user) !== '[]') {

            	       console.log("User " + user_mail + "logged in at : " +  new Date());
                    errorResponse.sendErrorResponse(response, 200, "OK", "The User is Valid");
                } else {

                    errorResponse.sendErrorResponse(response, 401, "Unauthorised", "The User is Invalid");
                }
            }
        }, {
            email: user_mail
        }, "email");
    });

module.exports = router;