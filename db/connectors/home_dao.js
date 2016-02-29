var User = require('../models/user');
var Home = require('../models/home');
var Product = require('../models/product');
var constants = require('../../utilities/constants');
var Utility = new require('../../utilities')();
var queryBuilder = new require('../../utilities/query_builder')();

var fieldsOmittedFromResponse = {
    '__v': 0,
    'createdAt': 0
};

var HomeDAO = function () {

    return Object.create(HomeDAO.prototype);
};

HomeDAO.prototype.createHome = function (homeObject, id_type, callback) {

    homeObject.owner_mail = homeObject.owner_mail.toLowerCase();
    if (homeObject.community_name !== undefined) {

        homeObject.location.community_name = homeObject.community_name;
        delete homeObject.community_name;
    }
    switch (id_type) {

        case constants.Email:
            User.findOne({
                email: homeObject.owner_mail
            }, {
                email: 1
            }, function (err, owner) {
                if (err) {

                    console.log(err);
                    callback({
                        code: 500,
                        message: constants.INTERNAL_SERVER_ERROR,
                        description: "Unknown DB error occurred while fetching Owner Information"
                    });
                } else {

                    if (owner !== undefined && owner !== null) {

                        if (owner.email !== undefined) {

                            var home = new Home(homeObject);
                            home.owner_id = owner._id;

                            home.save(function (err, home) {
                                if (err) {

                                    if (err.code === 11000) {

                                        if (String(err.errmsg).match(constants.name)) {

                                            callback({
                                                code: 409,
                                                message: constants.CONFLICT_ERROR,
                                                description: "The user with specified Home already exists in the system."
                                            });
                                        }
                                    } else {

                                        console.log(err);
                                        callback({
                                            code: 500,
                                            message: constants.INTERNAL_SERVER_ERROR,
                                            description: "Unknown DB error occurred while saving Home"
                                        });
                                    }

                                } else {

                                    callback(null, Utility.getLocation(home._id, constants.Home, constants.Created, constants.Homes));
                                }
                            });
                        } else {

                            callback({
                                code: 400,
                                message: constants.BAD_REQUEST_ERROR,
                                description: "Invalid Owner Mail"
                            });
                        }
                    } else {

                        callback({code: 400, message: constants.BAD_REQUEST_ERROR, description: "Invalid Owner Mail"});
                    }
                }
            });
            break;
        case constants.Id:
            User.findOne({
                _id: homeObject.owner_id
            }, {
                email: 1
            }, function (err, owner) {
                if (err) {

                    console.log(err);
                    callback({
                        code: 500,
                        message: constants.INTERNAL_SERVER_ERROR,
                        description: "Unknown DB error occurred while fetching Owner Information"
                    });
                } else {

                    if (owner === undefined || owner === null) {

                        callback({code: 400, message: constants.BAD_REQUEST_ERROR, description: "Invalid Owner Id"});
                    } else {

                        var home = new Home(homeObject);
                        home.owner_mail = owner.email;

                        home.save(function (err, home) {
                            if (err) {

                                if (err.code === 11000) {

                                    if (String(err.errmsg).match(constants.name)) {

                                        callback({
                                            code: 409,
                                            message: constants.CONFLICT_ERROR,
                                            description: "The user with specified Home already exists in the system."
                                        });
                                    }
                                } else {

                                    console.log(err);
                                    callback({
                                        code: 500,
                                        message: constants.INTERNAL_SERVER_ERROR,
                                        description: "Unknown DB error occurred while saving Home"
                                    });
                                }
                            } else {

                                callback(null, Utility.getLocation(home._id, constants.Home, constants.Created, constants.Homes));
                            }
                        });
                    }
                }
            });
    }
};

HomeDAO.prototype.updateHome = function (homeObject, home_id, id_type, callback) {

    if (!((homeObject.owner_mail !== null && homeObject !== undefined) && (homeObject.owner_id !== null && homeObject.owner_id !== undefined))) {

        delete homeObject.owner_mail;
        delete homeObject.owner_id;
    } else {
        homeObject.owner_mail = homeObject.owner_mail.toLowerCase();
    }

    // TODO: Make the user fetching call series with home update.
    //if (homeObject.owner_mail !== undefined || homeObject.owner_mail !== null) {
    //
    //    homeObject.owner_mail = homeObject.owner_mail.toLowerCase();
    //    User.findOne({
    //       email: homeObject.owner_mail
    //    }, function (err, user) {
    //
    //        if (err || user === null || user === undefined) {
    //
    //            delete homeObject.owner_mail;
    //        } else {
    //
    //            homeObject.owner_id = user._id;
    //        }
    //    });
    //} else if (homeObject.owner_id !== undefined || homeObject.owner_id !== null) {
    //
    //    User.findOne({
    //        _id: homeObject.owner_id
    //    }, function (err, user) {
    //
    //        if (err || user === null || user === undefined) {
    //
    //            delete homeObject.owner_id;
    //        } else {
    //
    //            homeObject.owner_mail = user.email;
    //        }
    //    });
    //}
    if (homeObject.community_name !== undefined) {

        homeObject.location.community_name = homeObject.community_name;
        delete homeObject.community_name;
    }

    var validationError = Utility.validateInput(homeObject, constants.Home, constants.HTTP_PUT);
    if (validationError !== null) {

        callback({code: 400, message: constants.BAD_REQUEST_ERROR, description: validationError});
    } else {
        switch (id_type) {
            case constants.Id:

                Home.findOneAndUpdate({
                        "_id": home_id
                    }, homeObject, {
                        new: true
                    },
                    function (err, home) {
                        if (err) {
                            callback(err);
                        } else {

                            callback(null, Utility.getLocation(home._id, constants.Home, constants.Updated, constants.Homes));
                        }
                    });
                break;
        }
    }
};

HomeDAO.prototype.getHomes = function (filters, fetch_type, pagination_config, sort_config, callback) {

    switch (fetch_type) {
        case constants.Collection:
            var query = queryBuilder.build(Home, filters, fieldsOmittedFromResponse, sort_config, pagination_config);
            console.log(filters);
            query.exec(function (err, homes) {
                if (err) {

                    callback({
                        code: 404,
                        message: constants.NOT_FOUND_ERROR,
                        description: "The requested resource could not be fetched."
                    })
                } else {

                    homes = Utility.getLinkedObjects(homes, {type: constants.Home, linked_objects: ["self"]});
                    callback(null, homes);
                }
            });
            break;
        case constants.Id:
            var query = queryBuilder.build(Home, {_id: filters._id}, fieldsOmittedFromResponse);
            query.exec(function (err, home) {
                if (err) {

                    callback({
                        code: 404,
                        message: constants.NOT_FOUND_ERROR,
                        description: "The requested resource could not be fetched."
                    })
                } else {

                    Product.count({home_id: filters._id}, function (err, count) {

                        if (count > 0) {

                            callback(null, Utility.getLinkedObjects(home, {
                                type: constants.Home,
                                linked_objects: [constants.User, constants.Product]
                            }));
                        } else {

                            callback(null, Utility.getLinkedObjects(home, {
                                type: constants.Home,
                                linked_objects: [constants.User]
                            }));
                        }
                    });
                }
            });
            break;
    }
};

HomeDAO.prototype.deleteHome = function (home_id, callback) {

    Home.findOneAndRemove({
            _id: home_id
        },
        function (err) {
            if (err) {

                callback({
                    code: 500,
                    message: constants.INTERNAL_SERVER_ERROR,
                    description: "The requested resource could not be deleted."
                })
            } else {

                callback(null);
            }
        });
};

module.exports = HomeDAO;