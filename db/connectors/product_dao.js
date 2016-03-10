var Utility = new require('../../utilities')();
var constants = require('../../utilities/constants');
var Category = require('../models/category');
var SubCategory = require('../models/sub_category');
var Home = require('../models/home');
var Product = require('../models/product');

var ProductDAO = function () {

    return Object.create(ProductDAO.prototype);
};

ProductDAO.prototype.createProduct = function (productObject, callback) {

    var validationError = Utility.validateInput(productObject, constants.Product, constants.HTTP_POST)
    if (validationError !== null && validationError !== undefined) {

        callback({code: 400, message: constants.BAD_REQUEST_ERROR, description: validationError});
    } else {

        Home.findOne({
            name: productObject.home_name,
            owner_mail: productObject.owner_mail
        }, {owner_id: 1}, function (err, home) {

            if (err) {

                console.log(err);
                callback({
                    code: 500,
                    message: constants.INTERNAL_SERVER_ERROR,
                    description: "Unknown DB error occurred while creating Product"
                });
            } else if (home === undefined || home === null) {

                callback({
                    code: 400,
                    message: constants.BAD_REQUEST_ERROR,
                    description: "Could not find the home with the given details"
                });
            } else {

                productObject.home_id = home._id;
                productObject.owner_id = home.owner_id;
                Category.findOne({
                        name: productObject.category_name
                    },
                    {
                        name: -1, description: -1
                    }
                    ,
                    function (err, category) {

                        if (err) {

                            console.log(err);
                            callback({
                                code: 500,
                                message: constants.INTERNAL_SERVER_ERROR,
                                description: "Unknown DB error occurred while creating Product"
                            });
                        } else if (category === undefined || category === null) {

                            callback({
                                code: 400,
                                message: constants.BAD_REQUEST_ERROR,
                                description: "Could not find the specified category"
                            });
                        } else {

                            productObject.category_id = category._id;
                            SubCategory.findOne({
                                name: productObject.sub_category_name
                            }, {category_id: 1}, function (err, subCategory) {

                                if (err) {

                                    console.log(err);
                                    callback({
                                        code: 500,
                                        message: constants.INTERNAL_SERVER_ERROR,
                                        description: "Unknown DB error occurred while creating Product"
                                    });
                                } else if (subCategory === undefined || subCategory === null) {

                                    callback({
                                        code: 400,
                                        message: constants.BAD_REQUEST_ERROR,
                                        description: "Could not find the specified sub-category"
                                    });
                                }
                                // else if (subCategory.category_id !== productObject.category_id) {
                                //
                                //    callback({
                                //        code: 400,
                                //        message: constants.BAD_REQUEST_ERROR,
                                //        description: "Could not find the specified sub-category under the given category"
                                //    });
                                //}
                                else {

                                    productObject.sub_category_id = subCategory._id;
                                    var product = new Product(productObject);
                                    product.save(err, product)
                                    {

                                        if (err) {

                                            console.log(err);
                                            callback({
                                                code: 500,
                                                message: constants.INTERNAL_SERVER_ERROR,
                                                description: "Unknown DB error occurred while creating Product"
                                            });
                                        } else {

                                            callback(null, Utility.getLocation(product._id, constants.Product, constants.Created, constants.Products));
                                        }
                                    }
                                }
                            });
                        }
                    });
            }
        });
    }
};

ProductDAO.prototype.updateProduct = function (productObject, product_id, callback) {

    var validationError = Utility.validateInput(productObject, constants.Product, constants.HTTP_PUT)
    if (validationError !== null || validationError !== undefined) {

        callback({code: 400, message: constants.BAD_REQUEST_ERROR, description: validationError});
    } else {

        if (productObject.home_name !== undefined && productObject.home_name !== null) {

            if (productObject.owner_mail !== undefined && productObject.owner_mail !== null) {

                Home.findOne({
                    name: productObject.home_name,
                    owner_mail: productObject.owner_mail
                }, {
                    owner_id: 1
                }, function (err, home) {

                    if (err || home === null || home === undefined) {

                        callback({
                            code: 400,
                            message: constants.BAD_REQUEST_ERROR,
                            description: "Could not find the specified Home"
                        });
                    } else if (home._id === undefined || home._id === null) {

                        callback({
                            code: 400,
                            message: constants.BAD_REQUEST_ERROR,
                            description: "Could not find the specified Home"
                        });
                    } else {

                        productObject.home_id = home._id;
                        productObject.owner_id = home.owner_id;
                    }
                });
            } else {

                callback({
                    code: 400,
                    message: constants.BAD_REQUEST_ERROR,
                    description: "The Owner Mail cannot be empty"
                });
            }
        } else if (productObject.category_name !== undefined && productObject.category_name !== null) {

            Category.findOne({

                name: productObject.category_name
            }, {
                name: 1
            }, function (err, category) {

                if (err || category === null || category === undefined) {

                    callback({
                        code: 400,
                        message: constants.BAD_REQUEST_ERROR,
                        description: "Could not find the category"
                    });
                } else {

                    productObject.category_id = category._id;
                }
            });
            if (productObject.sub_category_name !== undefined && productObject.category_name !== null) {

                SubCategory.findOne({
                    name: productObject.sub_category_name,
                    category_id: productObject.category_id
                }, {
                    name: 1
                }, function (err, subCategory) {

                    if (err || subCategory === undefined || subCategory === null) {

                        callback({
                            code: 400,
                            message: constants.BAD_REQUEST_ERROR,
                            description: "Could not find the sub category under the given category"
                        });
                    } else {

                        productObject.sub_category_id = subCategory._id;
                    }
                });
            } else {

                callback({
                    code: 400,
                    message: constants.BAD_REQUEST_ERROR,
                    description: "Could not find the sub category under the given category"
                });
            }
        }
        Product.findOneAndUpdate({

            _id: product_id
        }, {
            new: true
        }, function (err, product) {

            if (err) {

                console.log(err);
                callback({
                    code: 500,
                    message: constants.INTERNAL_SERVER_ERROR,
                    description: "Unknown DB error occurred while updating the product"
                });
            } else {

                callback(null, Utility.getLocation(product._id, constants.Product, constants.Updated, constants.Products));
            }
        });
    }
};

ProductDAO.prototype.getProducts = function (filters, fetchType, paginationConfig, sortConfig, callback) {


};

ProductDAO.prototype.deleteProduct = function (productId, callback) {

    Product.findOneAndRemove({_id: productId}, function (err) {

        if (err) {

            console.log(err);
            callback({
                code: 500,
                message: constants.INTERNAL_SERVER_ERROR,
                description: "Unknown DB error occurred while deleting Product"
            });
        } else {

            callback(null);
        }
    });
};

module.exports = ProductDAO;