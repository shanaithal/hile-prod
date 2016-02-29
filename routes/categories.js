var express = require('express');
var router = express.Router();
var connector = new require('../db/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();

router.route('/categories')
	.post(function (request, response) {

		var categoryObject = request.body;
		connector.createCategory(function (err, location) {

			if (!err) {

				response.status(201).json(location);
			} else if (location) {

				errorResponse.sendErrorResponse(response, 500, "Internal Sever Error", "The requested resource cannot be created.");
			}
		}, categoryObject);
	}).get(function (request, response) {

	var filters = Utility.getFilters(request.query);
	connector.getCategories(function (err, categories) {

		if (err) {
			errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found");
		} else {
			if (categories.length > 0) {
				response.status(200);
				response.setHeader('content-type', 'application/json');
				response.json(Utility.getFormattedResponse(categories));
			} else {
				errorResponse.sendErrorResponse(response, 404, "Not Found", "There are no categories in the System");
			}
		}
	}, filters);
});

router.route('/categories/:category_id')
	.get(function (request, response) {

		connector.getCategories(function (err, category) {

			if (err) {
				errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found");
			} else {
				if (category.length > 0 && category !== {}) {
					response.status(200);
					response.setHeader('content-type', 'application/json');
					response.json(Utility.getFormattedResponse(category));
				} else {
					errorResponse.sendErrorResponse(response, 404, "Not Found", "There requested resource not found");
				}
			}
		}, {_id: request.params.category_id}, "_id");
	})
	.delete(function (request, response) {

		connector.deleteCategory(function (err) {
			if (err) {
				errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The requested operation cannot be done.");
			} else {
				response.status(204).send();
			}
		}, request.params.category_id);
	});

router.route('/categories/:category_id/subcategories')
	.post(function (request, response) {

		var category_id = request.params.category_id;
		var subCategoriesObject = request.body;
		subCategoriesObject.category_id = category_id;
		connector.createSubCategory(function (err, location) {

			if (err) {
				errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The SubCategory cannot be created.");
			} else {
				response.status(201).json(location);
			}
		}, subCategoriesObject);
	});

router.route('/subcategories')
	.get(function (request, response) {

		connector.getSubCategories(function (err, subCategories) {

			if (err) {
				errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource could not be found");
			} else {

				if (subCategories.length > 0) {
					response.status(200).json(Utility.getFormattedResponse(subCategories));
				} else {
					errorResponse.sendErrorResponse(response, 404, "Not Found", "There are no subcategories in the System");
				}
			}
		});
	});

router.route('/subcategories/:subcategory_id')
	.get(function (request, response) {

		var subcategory_id = request.params.subcategory_id;
		connector.getSubCategories(function (err, subCategory) {

			if (err) {
				errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested subcategory could not be found");
			} else {

				response.status(200).json(Utility.getFormattedResponse(subCategory));
			}
		}, {_id: subcategory_id}, "_id");
	});

module.exports = router;