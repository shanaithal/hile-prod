var Category = require('../models/category');
var SubCategory = require('../models/sub_category');
var Utility = new require('../../utilities')();
var QueryBuilder = new require('../../utilities/query_builder')();
var constants = require('../../utilities/constants');

var CategoryDAO = function () {

    return Object.create(CategoryDAO.prototype);
}

CategoryDAO.prototype.createCategory = function (categoryObject, callback) {

    var category = new Category();
    category.name = categoryObject.name;
    category.description = categoryObject.description;

    category.save(function (err, category) {
            if (err) {

                callback(err);
            } else {
                var sub_categories = categoryObject.sub_categories;
                if (sub_categories) {

                    sub_categories.forEach(function (sub_category, index) {

                        var subCategory = new SubCategory(sub_category);
                        subCategory.category_id = category._id;
                        subCategory.save(function (err, sub) {

                            if (err) {

                                console.log(err);
                                callback({
                                    code: 500,
                                    message: constants.INTERNAL_SERVER_ERROR,
                                    description: "Unknown DB error occurred while creating category"
                                });
                            }
                        });
                    });
                    callback(null, Utility.getLocation(category._id, constants.Category, constants.Created, constants.Categories));
                } else {

                    callback(null, Utility.getLocation(category._id, constants.Category, constants.Created, constants.Categories));
                }
            }
        }
    );
};

module.exports = CategoryDAO;