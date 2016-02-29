var config = require('../config');
var constants = require('./constants');
var validator = require('validator');

var Utility = function () {

    return Object.create(Utility.prototype);
};

var selfObject = new Utility();

Utility.prototype.getLocation = function (resourceId, entity, operation, baseResource) {

    return {
        message: "The " + entity + " is " + operation + " successfully.",
        href: config.service_url + "/" + baseResource + "/" + resourceId
    };
};

Utility.prototype.isArray = function (entity) {

    if (entity === null || entity === undefined) {

        return false;
    }
    if (entity.constructor !== Array) {
        return false;
    }
    return true;
}

Utility.prototype.getFormattedResponse = function (resultSet) {
    if (!this.isArray(resultSet)) {
        resultSet = [resultSet];
    }
    var formatedResponse = {
        data: {
            items: resultSet
        }
    };
    return formatedResponse;
}

Utility.prototype.getFilters = function (queryParams) {

    var filters = queryParams;
    if (filters.page != undefined) {
        delete filters.page;
    }
    if (filters.count != undefined) {
        delete filters.count;
    }
    if (filters.sortby != undefined) {
        delete filters.sortby;
    }
    if (filters.order != undefined) {
        delete filters.order;
    }

    if (filters === null) {

        filters = {};
    }
    //var clone = JSON.parse(JSON.stringify(queryParams));
    return filters;
};

Utility.prototype.getNextPage = function (path, page, count) {

    path = path.replace(/[p][a][g][e][=][0-9]+[&]/i, "").replace(/[p][a][g][e][=][0-9]+/i, "");
    path = path.replace(/[c][o][u][n][t][=][0-9]+[&]/i, "").replace(/[c][o][u][n][t][=][0-9]+/i, "");
    path = config.service_url + path;
    if (path.indexOf('?') > -1) {
        if (path.indexOf('?') === (path.length - 1)) {
            path = path + "page=" + page + "&count=" + count;
        } else {
            path = path + "&page=" + page + "&count=" + count;
        }
    } else {
        path = path + "?page=" + page + "&count=" + count;
    }

    return _getLinkObject(path, "next");
};

Utility.prototype.getPreviousPage = function (path, page, count) {

    path = path.replace(/[p][a][g][e][=][0-9]+[&]/i, "").replace(/[p][a][g][e][=][0-9]+/i, "");
    path = path.replace(/[c][o][u][n][t][=][0-9]+[&]/i, "").replace(/[c][o][u][n][t][=][0-9]+/i, "");
    path = config.service_url + path;
    if (path.indexOf('?') > -1) {
        path = path + "page=" + page + "&count=" + count;
    } else {
        path = path + "&page=" + page + "&count=" + count;
    }

    return _getLinkObject(path, "prev");
};

Utility.prototype.getLinkedObjects = function (collections, entity_info) {

    if (!selfObject.isArray(collections)) {

        collections = [collections];
    }
    switch (entity_info.type) {

        case "user":

            collections.forEach(function (element, index) {

                if (element.links === undefined) {
                    element.links = [];
                }

                var self_link;
                if (entity_info.linked_objects.indexOf("self") > -1) {
                    self_link = {
                        href: config.service_url + "/users/" + element._id,
                        rel: "self"
                    };
                    element.links.push(self_link);
                    return;
                }
                var home_link;
                if (entity_info.linked_objects.indexOf("home") > -1) {
                    home_link = {
                        href: config.service_url + "/homes?owner_id=" + element._id,
                        rel: "Home"
                    };
                }
                var product_link;
                if (entity_info.linked_objects.indexOf("product") > -1) {
                    product_link = {
                        href: config.service_url + "/products?owner_id=" + element._id,
                        rel: "Product"
                    };
                }

                if (home_link !== undefined) {
                    element.links.push(home_link);
                }
                if (product_link !== undefined) {
                    element.links.push(product_link);
                }
            });
            break;
        case "home":

            collections.forEach(function (element, index) {

                if (element.links === undefined) {
                    element.links = [];
                }

                var self_link;
                if (entity_info.linked_objects.indexOf("self") > -1) {
                    self_link = {
                        href: config.service_url + "/homes/" + element._id,
                        rel: "self"
                    };
                    element.links.push(self_link);
                    return;
                }
                var user_link = {
                    href: config.service_url + "/users/" + element.owner_id,
                    rel: "User"
                };

                var product_link;
                if (entity_info.linked_objects.indexOf("product") > -1) {
                    product_link = {
                        href: config.service_url + "/products?home_id=" + element._id,
                        rel: "Product"
                    };
                }

                element.links.push(user_link);

                if (product_link !== undefined) {
                    element.links.push(product_link);
                }
            });
            break;
        case "product":

            collections.forEach(function (element, index) {


                if (element.links === undefined) {
                    element.links = [];
                }

                var self_link;
                if (entity_info.linked_objects.indexOf("self") > -1) {
                    self_link = {
                        href: config.service_url + "/products/" + element._id,
                        rel: "self"
                    };
                    element.links.push(self_link);
                    return;
                }

                var user_link = {
                    href: config.service_url + "/users/" + element.owner_id,
                    rel: "User"
                };

                var home_link = {
                    href: config.service_url + "/homes/" + element.home_id,
                    rel: "Home"
                };

                var buzz_link;
                if (entity_info.linked_objects.indexOf("buzz") > -1) {

                    buzz_link = {

                        href: config.service_url + "/buzzes?product_id=" + element._id,
                        rel: "Buzz"
                    }
                }

                var review_link;
                if (entity_info.linked_objects.indexOf("review") > -1) {

                    buzz_link = {

                        href: config.service_url + "/reviews?product_id=" + element._id,
                        rel: "Review"
                    }
                }
                if (entity_info.linked_objects.indexOf("user") > -1) {

                    element.links.push(user_link);
                }
                if (entity_info.linked_objects.indexOf("user") > -1) {

                    element.links.push(home_link);
                }
                if (buzz_link !== undefined) {

                    element.links.push(buzz_link);
                }
                if (review_link !== undefined) {

                    element.links.push(review_link);
                }
            });
            break;
        case "buzz":

            collections.forEach(function (element, index) {

                if (element.links === undefined) {
                    element.links = [];
                }

                var self_link;
                if (entity_info.linked_objects.indexOf("self") > -1) {
                    self_link = {
                        href: config.service_url + "/buzzes/" + element._id,
                        rel: "self"
                    };
                    element.links.push(self_link);
                    return;
                }

                var buzzer_link = {
                    href: config.service_url + "/users/" + element.buzzer_id,
                    rel: "Buzzer"
                };

                var owner_link = {
                    href: config.service_url + "/users/" + element.product_owner_id,
                    rel: "Owner"
                };

                element.links.push(buzzer_link);
                element.links.push(owner_link);
            });
            break;

    }

    return collections;
};

function _removePageCountQueryParams(path) {

    return path;
}

function _getLinkObject(path, rel) {

    var linkObject = {};
    linkObject.href = path;
    linkObject.rel = rel;

    return linkObject;
}

Utility.prototype.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

Utility.prototype.validateInput = function (input, entity_type, operation) {

    try {

        switch (entity_type) {

            case constants.User:

                switch (operation) {

                    case constants.HTTP_POST:
                        if (!validator.isEmail(input.email)) {

                            return "Invalid Email";
                        } else {

                            if (!validator.isNull(input.contact)) {

                                if (!validator.isMobilePhone(input.contact, 'en-IN')) {

                                    return "Invalid Contact";
                                }
                            }
                        }
                        break;
                    case constants.HTTP_PUT:
                        if (!validator.isNull(input.contact)) {

                            if (!validator.isMobilePhone(input.contact, 'en-IN')) {

                                return "Invalid Contact";
                            }
                        }
                        break;
                }
                break;
            case constants.Home:

                switch (operation) {

                    case constants.HTTP_POST:

                        if (validator.isNull(input.name)) {

                            return "Home name cannot be empty";
                        } else {
                            if (!validator.isNull(input.owner_mail)) {
                                if (!validator.isEmail(input.owner_mail)) {

                                    return "Invalid Owner Mail";
                                }
                            }
                            if (validator.isNull(input.owner_mail) && validator.isNull(input.owner_id)) {

                                return "Owner Information cannot be empty";
                            }
                        }
                        break;
                    case constants.HTTP_PUT:

                        if (!validator.isNull(input.owner_mail)) {
                            if (!validator.isEmail(input.owner_mail)) {

                                return "Invalid Owner Mail";
                            }
                        }
                        break;
                }
                break;
            case constants.Product:

                switch (operation) {

                    case constants.HTTP_POST:
                        if (!validator.isNull(input)) {

                            if (validator.isNull(input.name)) {

                                return "Product name cannot be empty";
                            } else if (validator.isNull(input.home_name)) {

                                return "Home name cannot be empty";
                            } else if (validator.isNull(input.owner_mail)) {

                                return "Owner Mail cannot be empty";
                            } else if (!validator.isEmail(input.owner_mail)) {

                                return "Invalid Owner Mail";
                            } else if (validator.isNull(input.category_name)) {

                                return "Category cannot be empty";
                            } else if (validator.isNull(input.sub_category_name)) {

                                return "Sub Category cannot be empty"
                            }
                        } else {

                            return "Empty Payload";
                        }
                        break;
                    case constants.HTTP_PUT:
                        break;
                }
                break;
        }
    } catch (e) {

        console.log(e);
        return e.message;
    }

    return null;
};

Utility.prototype.isEmail = function (string) {

    if (validator.isNull(string)) {

        return false;
    } else if (validator.isEmail(string)) {

        return true;
    }

    return false;
};

module.exports = Utility;