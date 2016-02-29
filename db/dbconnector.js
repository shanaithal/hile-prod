var mongoose = require('mongoose');
var User = require('./models/user');
var Home = require('./models/home');
var Category = require('./models/category');
var SubCategory = require('./models/sub_category');
var Product = require('./models/product');
var Buzz = require('./models/buzz');
var QueryBuilder = new require('./../utilities/query_builder')();
var Image = require('./models/image');
var fs = require('fs');
var Utility = new require('./../utilities/index')();
var Review = require('./models/review');

var SMSClient = new require('./../utilities/sms_alert')();
var MAILClient = new require('./../utilities/mail_alert')();

var config = require('../config/index');
var Vendor = require('./models/vendor');
var fieldsOmittedFromResponse = {
    '__v': 0,
    'createdAt': 0,
    'local': 0
};

var userDAO = new require('./connectors/user_dao')();
var homeDAO = new require('./connectors/home_dao')();
var categoryDAO = new require('./connectors/category_dao')();
var vendorDAO = new require('./connectors/vendor_dao')();
var productDAO = new require('./connectors/product_dao')();
var buzzDAO = new require('./connectors/buzz_dao')();

var constants = require('../utilities/constants');

if (mongoose.connection.readyState === 0) {
    mongoose.connect(config.dbHost + '/' + config.databaseName);
}

var DBConnector = function () {
    return Object.create(DBConnector.prototype);
};

var selfRefObject = new DBConnector();

function _getLocation(resource_id, entity, operation, base_resource) {

    return {
        message: "The " + entity + " is " + operation + " successfully.",
        href: config.service_url + "/" + base_resource + "/" + resource_id
    };
}

DBConnector.prototype.createUser = function (callback, userObject) {

    userDAO.createUser(userObject, callback);
};

DBConnector.prototype.updateUser = function (callback, userObject, user_id, identifierType) {

    userDAO.updateUser(userObject, user_id, identifierType, callback);
};

DBConnector.prototype.getUsers = function (callback, filters, fetchType, pagination_config, sort_config) {

    userDAO.getUsers(filters, fetchType, pagination_config, sort_config, callback);
};

DBConnector.prototype.deleteUser = function (callback, user_id, identifierType) {

    userDAO.deleteUser(user_id, identifierType, callback);
};

DBConnector.prototype.createHome = function (callback, homeObject, identifierType) {

    homeDAO.createHome(homeObject, identifierType, callback);
};

DBConnector.prototype.updateHome = function (callback, homeObject, home_id, identifierType) {

    homeDAO.updateHome(homeObject, home_id, identifierType, callback);
};

DBConnector.prototype.getHomes = function (callback, filters, fetchType, pagination_config, sort_config) {

    homeDAO.getHomes(filters, fetchType, pagination_config, sort_config, callback);
};

DBConnector.prototype.deleteHome = function (callback, home_id) {

    homeDAO.deleteHome(home_id, callback);
};

DBConnector.prototype.createSubCategory = function (callback, sub_categoryObject) {

    var sub_category = new SubCategory({
        name: sub_categoryObject.name,
        description: sub_categoryObject.description,
        category_id: sub_categoryObject.category_id
    });

    sub_category.save(function (err, sub_category) {

        if (err) {
            callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
        } else {
            callback(null, _getLocation(sub_category._id, "SubCategory", "created", "subcategories"));
        }
    });
};

DBConnector.prototype.getSubCategories = function (callback, filterObject, identifierType) {

    switch (identifierType) {
        case "_id":
            SubCategory.findById(filterObject._id, fieldsOmittedFromResponse, function (err, subCategory) {

                if (err) {

                    callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                } else {

                    callback(null, subCategory);
                }
            })
            break;
        default :
            var query = QueryBuilder.build(SubCategory, filterObject, fieldsOmittedFromResponse);
            query.exec(function (err, subCategories) {
                if (err) {
                    callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                } else {
                    callback(null, subCategories);
                }
            });
            break;
    }
};

DBConnector.prototype.deleteSubCategory = function (callback, sub_category_id) {

    SubCategory.findOneAndRemove({_id: sub_category_id}, function (err) {

        if (err) {
            callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
        } else {
            callback(null);
        }
    });
};

DBConnector.prototype.createCategory = function (callback, categoryObject) {

    categoryDAO.createCategory(categoryObject, callback);
};

DBConnector.prototype.getCategories = function (callback, filters, identifierType) {

    var query;
    switch (identifierType) {
        case "_id":
            query = QueryBuilder.build(Category, filters, fieldsOmittedFromResponse);
            query.exec(function (err, category) {
                if (err) {
                    callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                } else {
                    selfRefObject.getSubCategories(function (err, subCategories) {
                        if (err) {
                            callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                        } else {
                            if (subCategories.length > 0) {
                                var clone = JSON.parse(JSON.stringify(category));
                                clone.sub_categories = subCategories;
                                clone = [clone];
                                callback(null, clone);
                            } else {
                                callback(null, category);
                            }
                        }
                    }, filters);
                }
            });
            break;
        default:
            query = QueryBuilder.build(Category, filters, fieldsOmittedFromResponse);
            query.exec(function (err, categories) {
                if (err) {
                    callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                } else {
                    callback(null, categories);
                }
            });
            break;
    }
};

DBConnector.prototype.deleteCategory = function (callback, category_id) {

    Category.findOneAndRemove({
            _id: category_id
        },
        function (err) {
            if (err) {
                callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
            } else {
                callback(null);
            }
        });
};

DBConnector.prototype.createProduct = function (callback, productObject) {

    productDAO.createProduct(productObject, callback);
};

DBConnector.prototype.getProducts = function (callback, filters, fetchType, pagination_config, sort_config) {

    var query;
    switch (fetchType) {
        case "_id":
            query = QueryBuilder.build(Product, {_id: filters._id}, fieldsOmittedFromResponse, pagination_config, sort_config);
            query.exec(function (err, product) {

                    if (err) {

                        callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                    } else {

                        Buzz.count({product_id: filters._id}, function (err, count) {

                                product = Utility.getLinkedObjects(product, {
                                    type: "product",
                                    linked_objects: ["home", "user"]
                                })[0];
                                if (count > 0) {

                                    product = Utility.getLinkedObjects(product, {
                                        type: "product",
                                        linked_objects: ["buzz"]
                                    })[0];
                                }

                                Review.count({product_id: filters._id}, function (err, review_count) {

                                    if (review_count > 0) {

                                        product = Utility.getLinkedObjects(product, {
                                            type: "product",
                                            linked_objects: ["review"]
                                        })[0];
                                    }

                                    if (product !== undefined && product !== null) {
                                        Image.find({
                                            entity_type: "product",
                                            entity_id: product._id
                                        }, {_id: 1}, function (err, images) {
                                            if (images !== undefined && images.length !== 0) {
                                                if (product.images === undefined) {
                                                    product.images = [];
                                                }
                                                images.forEach(function (element, index) {

                                                    var image_link = {
                                                        href: config.service_url + "/images/" + element._id,
                                                        rel: "Image"
                                                    }

                                                    product.images.push(image_link);
                                                });
                                            }
                                            callback(null, product);
                                        });
                                    }
                                });
                            }
                        );
                    }
                }
            );
            break;
        default:
            query = QueryBuilder.build(Product, filters, fieldsOmittedFromResponse, sort_config, pagination_config);
            query.exec(function (err, products) {

                if (err) {

                    callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                } else {

                    var productLength = products.length;
                    products.forEach(function (product, index) {

                        Image.find({
                            entity_type: "product",
                            entity_id: products[index]._id
                        },
                        {
                            _id: 1
                        }).lean().exec(function (err, images) {

                            if (images !== undefined) {

                                if (!Utility.isArray(images)) {

                                    images = [images];
                                }
                                if (images[0] !== undefined) {
                                    products[index].image_content = images[0].content;

                                    var image_link = {
                                        href: config.service_url + "/images/" + images[0]._id,
                                        rel: "Image"
                                    };
                                    products[index].images = [image_link];
                                }
                            }
                        });
                    });

                    //TODO Make the image fetching call series with the callback
                    setTimeout(function () {
                        callback(null, Utility.getLinkedObjects(products, {type: "product", linked_objects: ["self"]}));
                    }, 1000);
                }
            });
    }
};

DBConnector.prototype.updateProduct = function (callback, productObject, product_id) {

    productDAO.updateProduct(productObject, product_id, callback);
};

DBConnector.prototype.deleteProduct = function (callback, product_id) {

    productDAO.deleteProduct(prodcut_id, callback);
};

DBConnector.prototype.createBuzz = function (callback, buzzObject) {

    var product_owner_id;
    selfRefObject.getProducts(function (err, product) {

        if (err) {

            callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});
        } else {

            if (product === null) {

                callback({code: 400, message: "Bad Request", description: "Could not find product"});
            } else {
                product_owner_id = product.owner_id;
                selfRefObject.getUsers(function (err, user) {

                    user = user[0];
                    if (err) {

                        callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                    } else {

                        if ((user === null) || user === {}) {

                            callback({code: 400, message: "Bad Request", description: "Could not find user"});
                        } else {

                            if (product_owner_id === user._id) {

                                callback({code: 400, message: "Bad Request", description: "User cannot buzz his own product"});
                            } else {

                                Buzz.findOne({buzzer_mail: user.email, product_id: buzzObject.product_id}, function (err, oldBuzz) {

                                    if (err) {

                                        callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                                    } else {

                                        if (oldBuzz === undefined || oldBuzz === null) {

                                            if (String(product_owner_id) === String(user._id)) {

                                                callback({code: 400, message: "Bad Request", description: "Buzzer and Product Owner are same"});
                                            } else {

                                                var buzz = new Buzz({
                                                    buzzer_mail: user.email,
                                                    buzzer_contact: user.contact,
                                                    buzzer_id: user._id,
                                                    product_id: buzzObject.product_id,
                                                    product_owner_id: product_owner_id,
                                                    negotiation_price: buzzObject.negotiation_price
                                                });

                                                buzz.save(function (err, buzz) {

                                                    if (err) {

                                                        callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                                                    } else {

                                                        SMSClient.triggerAlert(buzz);
                                                        MAILClient.triggerMail(buzz);
                                                        callback(null, _getLocation(buzz._id, "Buzz", "created", "buzzes"));
                                                    }
                                                });
                                            }
                                        } else {
                                            // Buzz found you are done..
                                            if ( new Date(oldBuzz.buzzedAt).getDate() === new Date().getDate()) {

                                                if (oldBuzz.status === 'done') {

                                                    if (String(product_owner_id) === String(user._id)) {

                                                        callback({code: 400, message: "Bad Request", description: "Buzzer and Product Owner are same"});
                                                    } else {

                                                        var buzz = new Buzz({
                                                            buzzer_mail: user.email,
                                                            buzzer_contact: user.contact,
                                                            buzzer_id: user._id,
                                                            product_id: buzzObject.product_id,
                                                            product_owner_id: product_owner_id,
                                                            negotiation_price: buzzObject.negotiation_price
                                                        });

                                                        buzz.save(function (err, buzz) {

                                                            if (err) {

                                                                callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                                                            } else {

                                                                SMSClient.triggerAlert(buzz);
                                                                MAILClient.triggerMail(buzz);
                                                                callback(null, _getLocation(buzz._id, "Buzz", "created", "buzzes"));
                                                            }
                                                        });
                                                    }
                                                } else {

                                                    callback({code: 400, message: "Bad Request", description: "User cannot buzz the same product without previous buzz completed"});
                                                }
                                            } else {

                                                if (String(product_owner_id) === String(user._id)) {

                                                    callback({code: 400, message: "Bad Request", description: "Buzzer and Product Owner are same"});
                                                } else {

                                                    var buzz = new Buzz({
                                                        buzzer_mail: user.email,
                                                        buzzer_contact: user.contact,
                                                        buzzer_id: user._id,
                                                        product_id: buzzObject.product_id,
                                                        product_owner_id: product_owner_id,
                                                        negotiation_price: buzzObject.negotiation_price
                                                    });

                                                    buzz.save(function (err, buzz) {

                                                        if (err) {

                                                            callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
                                                        } else {

                                                            SMSClient.triggerAlert(buzz);
                                                            MAILClient.triggerMail(buzz);
                                                            callback(null, _getLocation(buzz._id, "Buzz", "created", "buzzes"));
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                }, {email: buzzObject.buzzer_mail}, "email");
            }
        }
    }, {_id: buzzObject.product_id}, "_id");
};

DBConnector.prototype.getBuzzes = function (callback, filters, fetchType, paginationConfig, sortConfig) {

    buzzDAO.getBuzzes(filters, fetchType, paginationConfig, sortConfig, callback);
};

DBConnector.prototype.updateBuzz = function (callback, buzzId, buzzObject) {

    buzzDAO.updateBuzz(buzzObject, buzzId, callback);
};

DBConnector.prototype.deleteBuzz = function (callback, buzzId) {

    buzzDAO.deleteBuzz(buzzId, callback);
};

DBConnector.prototype.uploadImage = function (callback, file_path, entity_info) {

    switch (entity_info.type) {

        case constants.Product:
            Product.findById(entity_info.id, {name: 1}, function (err, product) {

                if (err) {

                    console.log(err);
                    callback({
                        code: 500,
                        message: constants.INTERNAL_SERVER_ERROR,
                        description: "Unknown DB error occurred while uploading the image"
                    });
                } else {

                    var file_content = new Buffer(fs.readFileSync(file_path)).toString('base64');
                    var image = new Image({
                        content: file_content,
                        content_type: file_path.split(".")[1],
                        entity_type: entity_info.type,
                        entity_id: product._id
                    });

                    image.save(function (err, image) {

                        if (err) {

                            console.log(err);
                            callback({
                                code: 500,
                                message: constants.INTERNAL_SERVER_ERROR,
                                description: "Unknown DB error occurred while uploading the image"
                            });
                        } else {

                            callback(null, Utility.getLocation(image._id, constants.Image, constants.Uploaded, constants.Images));
                        }
                    });
                }
            });
            break;
    }
};

DBConnector.prototype.upDateImage = function (callback, filePath, imageId) {

    Image.findOne({
            _id: imageId
        },
        function (err, image) {

            if (err) {

                console.log(err);
                callback({
                    code: 500,
                    message: constants.INTERNAL_SERVER_ERROR,
                    description: "Unknown DB error occurred while updating the image"
                });
            } else {
                if (image !== undefined && image !== null) {

                    image.content = new Buffer(fs.readFileSync(filePath)).toString('base64');

                    image.save(function (err, updatedImage) {

                        if (err) {

                            console.log(err);
                            callback({
                                code: 500,
                                message: constants.INTERNAL_SERVER_ERROR,
                                description: "Unknown DB error occurred while updating the image"
                            });
                        } else {

                            callback(null, Utility.getLocation(updatedImage._id, constants.Image, constants.Updated, constants.Images));
                        }
                    });
                } else {

                    callback({
                        code: 400,
                        message: constants.BAD_REQUEST_ERROR,
                        description: "Could not find the image at the given location"
                    });
                }
            }
        }
    )
};

DBConnector.prototype.getImages = function (callback, filters, fetchType) {

    switch (fetchType) {

        case constants.Id:
            Image.findOne({_id: filters._id}, fieldsOmittedFromResponse, function (err, image) {

                if (err) {

                    callback({
                        code: 404,
                        message: constants.NOT_FOUND_ERROR,
                        description: "The requested resource not found"
                    });
                } else {

                    callback(null, image);
                }
            });
            break;
        default:
            Image.find(filters, fieldsOmittedFromResponse, function (err, images) {

                if (err) {

                    callback({
                        code: 404,
                        message: constants.NOT_FOUND_ERROR,
                        description: "The requested resource not found"
                    });
                } else {

                    callback(null, images);
                }
            });
    }
};

DBConnector.prototype.getSearchTerm = function (callback, search_term, entity_type, filters, pagination_config) {

    var query;

    switch (entity_type) {

        case "home":
            break;
        case "user":
            break;
        default:
            //query = Product.find({$text: {$search: search_term}});
            if (pagination_config.limit > config.maxCount) {
                pagination_config.skip = config.defaultSkip;
                pagination_config.limit = config.defaultLimit;
            }
            if (pagination_config === {}) {
                pagination_config.skip = config.defaultSkip;
                pagination_config.limit = config.defaultLimit;
            }
            if (pagination_config.skip < 1) {
                pagination_config.skip = config.defaultSkip;
                pagination_config.limit = config.defaultLimit;
            }
            if (pagination_config.skip > 0) {
                pagination_config.skip = (pagination_config.skip - 1) * pagination_config.limit;
            }
            var regExPattern = new RegExp('.*' + search_term + '.*', 'i');
            query = Product.find({
                $or: [{name: {$regex: regExPattern}},
                    {description: {$regex: regExPattern}}, {category_name: {$regex: regExPattern}},
                    {sub_category_name: {$regex: regExPattern}}, {home_name: {$regex: regExPattern}},
                    {owner_mail: {$regex: regExPattern}}]
            }, fieldsOmittedFromResponse);
    }
    query.lean().exec(function (err, resultSet) {

            var pageElements = [];
            var consolidatedResult = [];
            if (filters !== undefined && JSON.stringify(filters) !== '{}') {

                var resultSetLength = resultSet.length;
                for (var index = 0; index < resultSetLength; index++) {

                    for (var key in filters) {

                        if (resultSet[index][key] === filters[key]) {

                            consolidatedResult.push(resultSet[index]);
                            break;
                        }
                    }
                }
            }
            else {

                consolidatedResult = resultSet;
            }

            if (pagination_config.skip === undefined) {

                pageElements = consolidatedResult;
            } else {

                var limit = parseInt(pagination_config.limit);
                for (var index = pagination_config.skip; index <= pagination_config.skip * limit; index++) {
                    pageElements.push(consolidatedResult[index]);
                }
            }

            var productLength = pageElements.length;
            pageElements.forEach(function (pageElement, index) {

                Image.find({
                    entity_type: "product",
                    entity_id: pageElements[index]._id
                }).lean().exec(function (err, images) {

                    if (images !== undefined) {

                        if (!Utility.isArray(images)) {

                            images = [images];
                        }
                        if (images[0] !== undefined) {
                            pageElements[index].image_content = images[0].content;

                            var image_link = {
                                href: config.service_url + "/images/" + images[0]._id,
                                rel: "Image"
                            };
                            pageElements[index].images = [image_link];
                        }
                    }
                });
            });

            //TODO: The call for getting image should be made series/sequential.
            setTimeout(function () {
                callback(null, Utility.getLinkedObjects(pageElements, {type: "product", linked_objects: ["self"]}));
            }, 750);
        }
    );
}

DBConnector.prototype.createVendor = function (callback, vendorObject) {

    vendorDAO.createVendor(vendorObject, callback);
};

DBConnector.prototype.getVendors = function (callback, filters, fetchType, paginationConfig, sortConfig) {

    vendorDAO.getVendors(filters, fetchType, paginationConfig, sortConfig, callback);
};

DBConnector.prototype.getCollectionCount = function (callback, collectionType) {

    switch (collectionType.toLowerCase()) {

        case "user":
            _getCollectionCount(callback, User);
            break;
        case "home":
            _getCollectionCount(callback, Home);
            break;
        case "product":
            _getCollectionCount(callback, Product);
            break;
        case "buzz":
            _getCollectionCount(callback, Buzz);
            break;
        case "vendor":
            _getCollectionCount(callback, Vendor);
            break;
    }
};

function _getCollectionCount(callback, collectionType) {

    collectionType.find({}).count(function (err, count) {

        if (err) {
            callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
        } else {
            callback(null, count);
        }
    });
}

function _insertImage(callback, images, entity_type, entity_id, entity_location) {

    if (!Utility.isArray(images)) {
        images = [images];
    }

    var successfulUploads = 0;
    var totalImages = images.length;

    images.forEach(function (imageData, index) {

        var image = new Image();
        image.entity_type = entity_type;
        image.entity_id = entity_id;
        image.content = imageData;

        image.save(function (err, uploadedImage) {

            if (err) {

                callback({code: 500, message: "Internal Server Error", description: "Unknown DB error occurred"});;
            } else {

                ++successfulUploads;
            }
        });
    });

    callback(null, entity_location);
}
module.exports = DBConnector;
