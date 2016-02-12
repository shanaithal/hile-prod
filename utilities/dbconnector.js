var mongoose = require('mongoose');
var User = require('../db/models/user');
var Home = require('../db/models/home');
var Category = require('../db/models/category');
var SubCategory = require('../db/models/sub_category');
var Product = require('../db/models/product');
var Buzz = require('../db/models/buzz');
var QueryBuilder = new require('./query_builder')();
var Image = require('../db/models/image');
var fs = require('fs');
var Utility = new require('./index')();
var Review = require('../db/models/review');
var SMSClient = new require('./sms_alert')();
var config = require('../config');
var Vendor = require('../db/models/vendor');
var fieldsOmittedFromResponse = {
    '__v': 0,
    'createdAt': 0,
    'local': 0
};

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

    var localUser = new User();
    var password;
    userObject.email = userObject.email.toLowerCase();
    if (userObject.password !== undefined) {

        password = localUser.generateHash(userObject.password);
        delete userObject.password;
        userObject.local = {};
        userObject.local.password =  password;
    }
    var user = new User(userObject);
    user.save(function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err);
        } else {
            callback(null, _getLocation(data._id, "user", "created", "users"));
        }
    });
};

DBConnector.prototype.updateUser = function (callback, userObject, user_id, identifierType) {

    // userObject.email = userObject.email.toLowerCase();
    var user = new User();

    delete userObject.email;

    if (userObject.password) {
        userObject.local = {};
        userObject.local.password = user.generateHash(userObject.password);
        delete userObject.password;
    }
    switch (identifierType) {
        case "email":
            User.findOneAndUpdate({
                    email: new RegExp('^' + user_id + '$', "i")
                }, userObject, {
                    new: true
                },
                function (err, user) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, _getLocation(user._id, "user", "updated", "users"));
                    }
                });
            break;
        case "_id":
            User.findOneAndUpdate({
                    _id: user_id
                }, userObject, {
                    new: true
                },
                function (err, user) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, _getLocation(user._id, "user", "updated", "users"));
                    }
                });
            break;
    }
};

DBConnector.prototype.getUsers = function (callback, filters, fetchType, pagination_config, sort_config) {

    switch (fetchType) {
        case "collection":
            var query = QueryBuilder.build(User, filters, fieldsOmittedFromResponse, sort_config, pagination_config)
            query.exec(function (err, users) {
                if (err) {

                    callback(err);
                } else {

                    users = Utility.getLinkedObjects(users, {type: "user", linked_objects: ["self"]});
                    callback(null, users);
                }
            });
            break;
        case "email":
            var query = QueryBuilder.build(User, {
                email: new RegExp('^' + filters.email + '$', "i")
            }, fieldsOmittedFromResponse);
            query.exec(function (err, user) {
                if (err) {
                    callback(err);
                } else {

                    Home.count({owner_mail: filters.email}, function (err, count) {

                        if (count > 0) {

                            Product.count({owner_mail: filters.email}, function (err, product_count) {

                                if (product_count > 0) {

                                    callback(null, Utility.getLinkedObjects(user, {
                                        type: "user",
                                        linked_objects: ["home", "product"]
                                    }));
                                } else {

                                    callback(null, Utility.getLinkedObjects(user, {
                                        type: "user",
                                        linked_objects: ["home"]
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
        case "_id":
            var query = QueryBuilder.build(User, {_id: filters._id}, fieldsOmittedFromResponse);
            query.exec(function (err, user) {
                if (err) {
                    callback(err);
                } else {

                    Home.count({owner_id: filters._id}, function (err, count) {

                        if (count > 0) {

                            Product.count({owner_id: filters._id}, function (err, product_count) {

                                if (product_count > 0) {

                                    callback(null, Utility.getLinkedObjects(user, {
                                        type: "user",
                                        linked_objects: ["home", "product"]
                                    }));
                                } else {

                                    callback(null, Utility.getLinkedObjects(user, {
                                        type: "user",
                                        linked_objects: ["home"]
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

DBConnector.prototype.deleteUser = function (callback, user_id, identifierType) {

    switch (identifierType) {
        case "email":
            User.findOneAndRemove({
                email: user_id
            }, function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
            break;
        case "_id":
            User.findOneAndRemove({
                _id: user_id
            }, function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
            break;
    }
};

DBConnector.prototype.createHome = function (callback, homeObject, identifierType) {

    switch (identifierType) {

        case "email":
            User.findOne({
                email: homeObject.owner_mail
            }, {
                email: 1
            }, function (err, owner) {
                if (err) {
                    callback(err);
                } else {
                    if (owner) {
                        var home = new Home({
                            name: homeObject.name,
                            owner_id: owner._id,
                            owner_mail: owner.email,
                            location: homeObject.location,
                            home_type: homeObject.home_type,
                            community_name: homeObject.community_name
                        });

                        home.save(function (err, home) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, _getLocation(home._id, "home", "created", "homes"));
                            }
                        });
                    } else {
                        callback({code: 400, message: "Bad Request", description: "Could not find User"});
                    }
                }
            });
            break;
        case "_id":
            User.findOne({
                _id: homeObject.owner_id
            }, {
                email: 1
            }, function (err, owner) {
                if (err) {
                    callback(err);
                } else {
                    if (owner) {

                        var home = new Home({
                            name: homeObject.name,
                            owner_id: owner._id,
                            owner_mail: owner.email,
                            location: homeObject.location
                        });

                        home.save(function (err, home) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, _getLocation(home._id, "home", "created", "homes"));
                            }
                        });
                    } else {
                        callback({code: 400, message: "Bad Request", description: "Could not find User"});
                    }

                }
            });
    }
};

DBConnector.prototype.updateHome = function (callback, homeObject, home_id, identifierType) {

    delete homeObject.owner_id;
    delete homeObject.owner_mail;

    switch (identifierType) {
        case "_id":
            Home.findOneAndUpdate({
                    "_id": home_id
                }, homeObject, {
                    new: true
                },
                function (err, home) {
                    if (err) {
                        callback(err);
                    } else {
                        if (home !== null) {
                            callback(null, _getLocation(home._id, "home", "updated", "homes"));
                        } else {
                            callback({message: "Internal DB     Error"});
                        }
                    }
                });
            break;
    }
};

DBConnector.prototype.getHomes = function (callback, filters, fetchType, pagination_config, sort_config) {
    switch (fetchType) {
        case "collection":
            var query = QueryBuilder.build(Home, filters, fieldsOmittedFromResponse, sort_config, pagination_config);
            query.exec(function (err, homes) {
                if (err) {
                    callback(err);
                } else {
                    homes = Utility.getLinkedObjects(homes, {type: "home", linked_objects: ["self"]});
                    callback(null, homes);
                }
            });
            break;
        case "_id":
            var query = QueryBuilder.build(Home, {_id: filters._id}, fieldsOmittedFromResponse);
            query.exec(function (err, home) {
                if (err) {
                    callback(err);
                } else {

                    Product.count({home_id: filters._id}, function (err, count) {

                        if (count > 0) {

                            callback(null, Utility.getLinkedObjects(home, {
                                type: "home",
                                linked_objects: ["user", "product"]
                            }));
                        } else {

                            callback(null, Utility.getLinkedObjects(home, {type: "home", linked_objects: ["user"]}));
                        }
                    });
                }
            });
            break;
    }
};

DBConnector.prototype.deleteHome = function (callback, home_id) {

    Home.findOneAndRemove({
            _id: home_id
        },
        function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
};

DBConnector.prototype.createSubCategory = function (callback, sub_categoryObject) {

    var sub_category = new SubCategory({
        name: sub_categoryObject.name,
        description: sub_categoryObject.description,
        category_id: sub_categoryObject.category_id
    });

    sub_category.save(function (err, sub_category) {

        if (err) {
            callback(err);
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

                    callback(err);
                } else {

                    callback(null, subCategory);
                }
            })
            break;
        default :
            var query = QueryBuilder.build(SubCategory, filterObject, fieldsOmittedFromResponse);
            query.exec(function (err, subCategories) {
                if (err) {
                    callback(err);
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
            callback(err);
        } else {
            callback(null);
        }
    });
};

DBConnector.prototype.createCategory = function (callback, categoryObject) {

    var category = new Category({
        name: categoryObject.name,
        description: categoryObject.description
    });

    category.save(function (err, category) {
            if (err) {
                callback(err);
            } else {
                var sub_categories = categoryObject.sub_categories;
                if (sub_categories) {
                    for (var sub_category in sub_categories) {

                        sub_categories[sub_category].category_id = category._id;
                        selfRefObject.createSubCategory(function (err) {
                            if (err) {
                                occured_error = err;
                            }
                        }, sub_categories[sub_category]);
                    }
                }
                callback(null, _getLocation(category._id, "Category", "created", "categories"));
            }
        }
    );

};

DBConnector.prototype.getCategories = function (callback, filters, identifierType) {

    var query;
    switch (identifierType) {
        case "_id":
            query = QueryBuilder.build(Category, filters, fieldsOmittedFromResponse);
            query.exec(function (err, category) {
                if (err) {
                    callback(err);
                } else {
                    selfRefObject.getSubCategories(function (err, subCategories) {
                        if (err) {
                            callback(err);
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
                    callback(err);
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
                callback(err);
            } else {
                callback(null);
            }
        });
};

DBConnector.prototype.createProduct = function (callback, productObject) {

    var images = [];

    if (productObject.images !== undefined && productObject.images !== null) {

        images.push(productObject.images);
        delete productObject.images;
    }
    Home.findOne({
        _id: productObject.home_id
    }, {name: 1}, function (err, home) {

        if (err) {
            callback(err);
        } else {
            if (home !== null) {

                var product = new Product(productObject);

                product.save(function (err, product) {

                    if (err) {
                        callback(err);
                    } else {

                        if (images.length > 0) {
                            _insertImage(callback, images, "product", product._id, _getLocation(product._id, "Product", "created", "products"));
                        } else {
                            callback(null, _getLocation(product._id, "Product", "created", "products"));
                        }
                    }
                });
            } else {

                callback({code: 400, message: "Bad Request", description: "Could not find Home"});
            }
        }
    });
};

DBConnector.prototype.getProducts = function (callback, filters, fetchType, pagination_config, sort_config) {

    var query;
    switch (fetchType) {
        case "_id":
            query = QueryBuilder.build(Product, {_id: filters._id}, fieldsOmittedFromResponse, pagination_config, sort_config);
            query.exec(function (err, product) {

                    if (err) {

                        callback(err);
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

                    callback(err);
                } else {

                    var productLength = products.length;
                    products.forEach(function (product, index) {

                        Image.find({
                            entity_type: "product",
                            entity_id: products[index]._id
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

                    // * it doesn't wait till the products is updated with image content..
                    setTimeout(function(){
                        callback(null, Utility.getLinkedObjects(products, {type: "product", linked_objects: ["self"]}));
                    }, 50);
                }
            });
    }
};

DBConnector.prototype.updateProduct = function (callback, productObject) {

    if (productObject.home_name !== undefined && productObject.owner_mail !== undefined) {

        Home.findOne({
            name: productObject.home_name,
            owner_mail: productObject.owner_mail
        }, {
            name: 1,
            owner_id: 1
        }, function (err, home) {

            if (home !== null && home !== undefined) {

                if (home.name !== null && home.name !== undefined) {

                    productObject.home_id = home._id;
                    productObject.owner_id = home.owner_id;
                    Product.findOneAndUpdate({_id: productObject._id},
                        productObject, {
                            new: true
                        },
                        function (err, product) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, _getLocation(product._id, "product", "updated", "products"));
                            }
                        });
                } else {

                    callback({code: 400, message: "Bad Request", description: "Could not find home"});
                }
            } else {

                callback({code: 400, message: "Bad Request", description: "Could not find home with the given user"});
            }
        });
    } else {

        Product.findOneAndUpdate({_id: productObject._id},
            productObject, {
                new: true
            },
            function (err, product) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, _getLocation(product._id, "product", "updated", "products"));
                }
            });
    };
};

DBConnector.prototype.deleteProduct = function (callback, product_id) {

    Product.findOneAndRemove({_id: product_id}, function (err) {

        if (err) {

            callback(err);
        } else {

            callback(null);
        }
    });
};

DBConnector.prototype.createBuzz = function (callback, buzzObject) {

   var product_owner_id;
    selfRefObject.getProducts(function (err, product) {

        if (err) {

            callback(err);
        } else {

            if (product === null) {

                callback({code: 400, message: "Bad Request", description: "Could not find product"});
            } else {
                product_owner_id = product.owner_id;
                selfRefObject.getUsers(function (err, user) {

                    user = user[0];
                    if (err) {

                        callback(err);
                    } else {

                        if ((user === null) || user === {}) {

                            callback({code: 400, message: "Bad Request", description: "Could not find user"});
                        } else {

                            if (product_owner_id === user._id) {

                                callback({code: 400, message: "Bad Request", description: "User cannot buzz his own product"});
                            } else {

                                Buzz.findOne({buzzer_mail: user.email, product_id: buzzObject.product_id}, function (err, oldBuzz) {

                                    if (err) {

                                        callback(err);
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

                                                            callback(err);
                                                        } else {

                                                            SMSClient.triggerAlert(buzz);
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

                                                                    callback(err);
                                                                } else {

                                                                    SMSClient.triggerAlert(buzz);
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

                                                                callback(err);
                                                            } else {

                                                                SMSClient.triggerAlert(buzz);
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

DBConnector.prototype.getBuzzes = function (callback, filters, fetchType, pagination_config, sort_config) {

    var query;
    switch (fetchType) {

        case "_id":

            query = QueryBuilder.build(Buzz, filters, fieldsOmittedFromResponse);
            break;
        default:

            query = QueryBuilder.build(Buzz, filters, fieldsOmittedFromResponse, sort_config, pagination_config);
    }
    query.exec(function (err, buzzes) {

        if (err) {

            callback(err);
        } else {

            if (buzzes.length > 1) {

                buzzes = Utility.getLinkedObjects(buzzes, {type: "buzz", linked_objects: ["self"]});
            }
            callback(null, Utility.getLinkedObjects(buzzes, {type: "buzz", linked_objects: []}));
        }
    });
};

DBConnector.prototype.updateBuzz = function (callback, buzzObject) {

    Buzz.findOneAndUpdate({
            _id: buzzObject._id,
        },
        {status: buzzObject.status},
        {new: true},
        function (err, buzz) {

            if (err) {

                callback(err);
            } else {

                if (buzz !== undefined && buzz !== null) {
                    callback(null, _getLocation(buzz._id, buzz, "updated", "buzzes"));
                } else {

                    callback({code: 400, message: "Bad Request", description: "Could not find Buzz"});
                }
            }
        }
    )
};

DBConnector.prototype.deleteBuzz = function (callback, buzz_id) {

    Buzz.findOneAndRemove({_id: buzz_id}, function (err) {

        if (err) {

            callback(err);
        } else {

            callback(null);
        }
    });
};

DBConnector.prototype.uploadImage = function (callback, file_path, entity_info) {

    switch (entity_info.type) {

        case "product":
            Product.findById(entity_info.id, {name: 1}, function (err, product) {

                if (err) {

                    callback(err);
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

                            callback(err);
                        } else {

                            callback(null, _getLocation(image._id, "Image", "uploaded", "images"))
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

                callback(err);
            } else {
                if (image !== undefined && image !== null) {

                    image.content = new Buffer(fs.readFileSync(filePath)).toString('base64');

                    image.save(function (err, updatedImage) {

                        if (err) {

                            callback(err);
                        } else {

                            callback(null, _getLocation(updatedImage._id, "image", "updated", "images"));
                        }
                    });
                } else {

                    callback({
                        code: 500,
                        message: "Internal Server Error",
                        description: "Could not find the image location"
                    });
                }
            }
        }
    )
};

DBConnector.prototype.getImages = function (callback, filters, fetchType) {

    switch (fetchType) {

        case "_id":
            Image.findOne({_id: filters._id}, fieldsOmittedFromResponse, function (err, image) {

                if (err) {

                    callback(err);
                } else {

                    callback(null, image);
                }
            });
            break;
        default:
            Image.find(filters, fieldsOmittedFromResponse, function (err, images) {

                if (err) {

                    callback(err);
                } else {

                    callback(null, images);
                }
            });
    }
};

DBConnector.prototype.getSearchTerm = function (callback, search_term, entity_type, filters, pagination_config) {

    console.log("Searched for the term: " + search_term);
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

        // * it doesn't wait till the products is updated with image content..
        setTimeout(function(){
            callback(null, Utility.getLinkedObjects(pageElements, {type: "product", linked_objects: ["self"]}));
        }, 750);
       }
    );
};

DBConnector.prototype.createVendor = function (callback, vendorObject) {
    var vendor = new Vendor(vendorObject);
    vendor.save(function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, _getLocation(data._id, "vendor", "created", "vendors"));
        }
    });
};

DBConnector.prototype.getVendors = function (callback, filters, fetchType, pagination_config, sort_config) {

    switch (fetchType) {
        case "collection":
            var query = QueryBuilder.build(Vendor, filters, fieldsOmittedFromResponse, sort_config, pagination_config)
            query.exec(function (err, vendors) {
                if (err) {

                    callback(err);
                } else {

                    callback(null, vendors);
                }
            });
            break;
        case "email":
            var query = QueryBuilder.build(Vendor, {
                vendor_email: new RegExp('^' + filters.vendor_email + '$', "i")
            }, fieldsOmittedFromResponse);
            query.exec(function (err, vendor) {
                if (err) {
                    callback(err);
                } else {

                    callback(null, vendor);
                }
            });
            break;
        case "_id":
            var query = QueryBuilder.build(Vendor, {_id: filters._id}, fieldsOmittedFromResponse);
            query.exec(function (err, vendor) {
                if (err) {
                    callback(err);
                } else {

                    callback(null, vendor);
                }
            });
            break;
    }
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
            callback(err);
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

                callback(err);
            } else {

                ++successfulUploads;
            }
        });
    });

        callback(null, entity_location);
}
module.exports = DBConnector;
