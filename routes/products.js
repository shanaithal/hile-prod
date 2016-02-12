var express = require('express');
var router = express.Router();
var connector = new require('../utilities/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();

router.route('/products')
	.post(function (request, response) {

		var productObject = request.body;
		connector.getCategories(function (err, category) {

			if (err) {

				errorResponse.sendErrorResponse(response, 400, "Bad Request", "Please check if the category exists");
			} else {

				productObject.category_id = category._id;
				connector.getSubCategories(function (err, subCategories) {
					if (err) {
						errorResponse.sendErrorResponse(response, 400, "Bad Request", "Please check if the sub category exists");
					} else {

						var subCategory = subCategories[0];
						if (subCategory === undefined || subCategory === {}) {

							errorResponse.sendErrorResponse(response, 400, "Bad Request", "Please check if the sub category exists");
						} else {
							productObject.sub_category_id = subCategory._id;
							var skipPagination = {};
							var skipSorting = {};
							connector.getHomes(function (err, homes) {

								if (err) {
									errorResponse.sendErrorResponse(response, 400, "Bad Request", "Please check if the home exists");
								} else {

									var home = homes[0];
									productObject.home_id = home._id;
									productObject.owner_id = home.owner_id;

									connector.createProduct(function (err, location) {

										if (err) {

											errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The requested resource could not be created");
										} else {

											response.status(201).json(location);
										}
									}, productObject);
								}
							}, {
								name: productObject.home_name,
								owner_mail: productObject.owner_mail
							}, "collection", skipPagination, skipSorting);
						}
					}
				});
			}
		}, {name: productObject.category_name}, "_id");
	}).get(function (request, response) {

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

	connector.getProducts(function (err, products) {
		if (err) {

			errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
		} else {

			if (products.length > 0) {
				connector.getCollectionCount(function (err, collectionSize) {

					products = Utility.getFormattedResponse(products);
					products.data.collection_size = collectionSize;
					if (collectionSize > elementCount) {
						products.data.pages = [];
						var lastPage = collectionSize / elementCount;
						if (page < lastPage) {
							products.data.pages.push(Utility.getNextPage(request.url, page + 1, elementCount));
						}
						if (page > 1) {
							products.data.pages.push(Utility.getPreviousPage(request.url, page - 1, elementCount));
						}
					}
					response.status(200).json(products);
				}, "product");
			} else {
				errorResponse.sendErrorResponse(response, 404, "Not Found", "There are no homes in the System.");
			}
		}
	}, filters, "collection", paginationConfig, sort_config);
});

router.route('/products/:product_id')
	.get(function (request, response) {

		var product_id = request.params.product_id;
		connector.getProducts(function (err, product) {

			if (err) {

				errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
			} else {

				response.status(200).json(Utility.getFormattedResponse(product));
			}
		}, {_id: product_id}, "_id", {}, {});
	}).put(function (request, response) {

	var productObject = request.body;
	var productId = request.params.product_id;
	productObject._id = productId;
	connector.updateProduct(function (err, location) {

		if (err) {

			errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The requested resource could not be updated");
		} else {

			response.status(200).json(location);
		}
	}, productObject);
}).delete(function (request, response) {

	connector.deleteProduct(function (err) {

		if (err) {

			errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The requested resource could not be deleted");
		} else {

			response.status(204).send();
		}
	}, request.params.product_id);
});

module.exports = router;