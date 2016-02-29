var User = require('../models/user');
var Home = require('../models/home');
var Product = require('../models/product');
var constants = require('../../utilities/constants');
var Utility = new require('../../utilities')();
var queryBuilder = new require('../../utilities/query_builder')();

var fieldsOmittedFromResponse = {
    '__v': 0,
    'createdAt': 0,
    'local': 0
};

var UserDAO = function () {
    return Object.create(UserDAO.prototype);
};

var modelReference = new User();

UserDAO.prototype.createUser = function (userObject, callback) {

    var password;
    userObject.email = userObject.email.toLowerCase();

    if (userObject.password !== undefined) {

        password = modelReference.generateHash(userObject.password);
        delete userObject.password;
        userObject.local = {};
        userObject.local.password = password;
    }

    var user = new User(userObject);
    user.save(function (err, data) {
        if (err) {
            if (err.code === 11000) {
                if (String(err.errmsg).match(constants.Contact)) {

                    callback({
                        code: 409,
                        message: constants.CONFLICT_ERROR,
                        description: "The user with specified contact already exists in the system."
                    });
                } else if (String(err.errmsg).match(constants.Email)) {

                    callback({
                        code: 409,
                        message: constants.CONFLICT_ERROR,
                        description: "The user with specified email already exists in the system."
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
            callback(null, Utility.getLocation(data._id, constants.User, constants.Created, constants.Users));
        }
    });
};

UserDAO.prototype.updateUser = function (userObject, user_id, id_type, callback) {

    delete userObject.email;

    if (userObject.password !== undefined) {

        userObject.local = {};
        userObject.local.password = modelReference.generateHash(userObject.password);
        delete userObject.password;
    }

    switch (id_type) {
        case constants.Email:
            User.findOneAndUpdate({
                    email: new RegExp('^' + user_id + '$', "i")
                }, userObject, {
                    new: true
                },
                function (err, user) {
                    if (err) {
                        if (err.code === 11000) {
                            if (String(err.errmsg).match(constants.Contact)) {

                                callback({
                                    code: 409,
                                    message: constants.CONFLICT_ERROR,
                                    "description": "The user with specified contact already exists in the system."
                                });
                            } else if (String(err.errmsg).match(constants.Email)) {

                                callback({
                                    code: 409,
                                    message: constants.CONFLICT_ERROR,
                                    "description": "The user with specified email already exists in the system."
                                });
                            } else {
                                callback({
                                    code: 500,
                                    message: constants.INTERNAL_SERVER_ERROR,
                                    "description": "Unknown DB error occurred"
                                });
                            }
                        }
                    } else {
                        callback(null, Utility.getLocation(user._id, constants.User, constants.Updated, constants.Users));
                    }
                });
            break;
        case constants.Id:
            User.findOneAndUpdate({
                    _id: user_id
                }, userObject, {
                    new: true
                },
                function (err, user) {
                    if (err) {
                        console.log(err);
                        callback({
                            code: 500,
                            message: constants.INTERNAL_SERVER_ERROR,
                            "description": "Unknown DB error occurred"
                        });
                    } else {
                        callback(null, Utility.getLocation(user._id, constants.User, constants.Updated, constants.Users));
                    }
                });
            break;
    }
};

UserDAO.prototype.getUsers = function (filters, fetch_type, pagination_config, sort_config, callback) {

    switch (fetch_type) {
        case constants.Collection:

            var query = queryBuilder.build(User, filters, fieldsOmittedFromResponse, sort_config, pagination_config)
            query.exec(function (err, users) {
                if (err) {

                    console.log(err);
                    callback({
                        code: 500,
                        message: constants.INTERNAL_SERVER_ERROR,
                        "description": "Unknown DB error occurred"
                    });
                } else {

                    users = Utility.getLinkedObjects(users, {type: constants.User, linked_objects: ["self"]});
                    callback(null, users);
                }
            });
            break;
        case constants.Email:

            var query = queryBuilder.build(User, {
                email: new RegExp('^' + filters.email + '$', "i")
            }, fieldsOmittedFromResponse);
            query.exec(function (err, user) {
                if (err) {

                    console.log(err);
                    callback({
                        code: 500,
                        message: constants.INTERNAL_SERVER_ERROR,
                        "description": "Unknown DB error occurred"
                    });
                } else {

                    Home.count({owner_mail: filters.email}, function (err, home_count) {

                        console.log(home_count);
                        if (home_count > 0) {

                            Product.count({owner_id: filters._id}, function (err, product_count) {

                                if (product_count > 0) {

                                    callback(null, Utility.getLinkedObjects(user, {
                                        type: constants.User,
                                        linked_objects: [constants.Home, constants.Product]
                                    }));
                                } else {

                                    callback(null, Utility.getLinkedObjects(user, {
                                        type: constants.User,
                                        linked_objects: [constants.Home]
                                    }));
                                }
                            });
                        } else {

                            callback(null, user);
                        }
                    });
                }
            });
            break;
        case constants.Id:
            var query = queryBuilder.build(User, {_id: filters._id}, fieldsOmittedFromResponse);
            query.exec(function (err, user) {
                if (err) {
                    console.log(err);
                    callback({
                        code: 500,
                        message: constants.INTERNAL_SERVER_ERROR,
                        "description": "Unknown DB error occurred"
                    });
                } else {

                    Home.count({owner_id: filters._id}, function (err, home_count) {

                        if (home_count > 0) {

                            Product.count({owner_id: filters._id}, function (err, product_count) {

                                if (product_count > 0) {

                                    callback(null, Utility.getLinkedObjects(user, {
                                        type: constants.User,
                                        linked_objects: [constants.Home, constants.Product]
                                    }));
                                } else {

                                    callback(null, Utility.getLinkedObjects(user, {
                                        type: constants.User,
                                        linked_objects: [constants.Home]
                                    }));
                                }
                            });
                        } else {

                            callback(null, user);
                        }
                    });
                }
            });
            break;
    }
};

UserDAO.prototype.deleteUser = function (user_id, id_type, callback) {

    switch (id_type) {
        case constants.Email:
            User.findOneAndRemove({
                email: user_id
            }, function (err) {
                if (err) {
                    console.log(err);
                    callback({
                        code: 500,
                        message: constants.INTERNAL_SERVER_ERROR,
                        "description": "Unknown DB error occurred"
                    });
                } else {
                    callback(null);
                }
            });
            break;
        case constants.Id:
            User.findOneAndRemove({
                _id: user_id
            }, function (err) {
                if (err) {
                    console.log(err);
                    callback({
                        code: 500,
                        message: constants.INTERNAL_SERVER_ERROR,
                        "description": "Unknown DB error occurred"
                    });
                } else {
                    callback(null);
                }
            });
            break;
    }
};
module.exports = UserDAO;