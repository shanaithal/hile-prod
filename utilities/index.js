var config = require('../config');

var Utility = function () {

    var utilityObject = Object.create(Utility.prototype);
    return utilityObject;
};

var selfObject = new Utility();

Utility.prototype.isArray = function (array) {

    if (array === null || array === undefined) {

        return false;
    }
    if (array.constructor !== Array) {
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

Utility.prototype._getFilters = function (queryParams) {

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
}

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
        path = path + "&page=" + page + "&count=" + count;
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
module.exports = Utility;