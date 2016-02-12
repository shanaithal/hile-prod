var express = require('express');
var router = express.Router();
var connector = new require('../utilities/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();

function validHome(homeObject) {

	if (homeObject.name.indexOf(" ") !== -1) {

		return false;
	}

	return true;
}

router.route('/homes')
	.post(function (request, response) {

		var homeObject = request.body;
		var owner_mail = homeObject.owner_mail;
		var emailPattern = /[a-z.-_]+[@]\w{1,10}[.]\w{1,5}/i;
		if (!validHome(homeObject)) {
			errorResponse.sendErrorResponse(response, 400, "Bad Request", "Invalid Payload");
		} else {
			if (owner_mail) {
				if (emailPattern.test(owner_mail)) {
					connector.createHome(function (err, location) {
						if (err) {
							errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "Could not create the requested resource");
						} else {
							response.status(201).json(location);
						}
					}, homeObject, "email");
				} else {
					errorResponse.sendErrorResponse(response, 400, "Bad Request", "Invalid Payload");
				}
			} else {
				connector.createHome(function (err, location) {
					if (err) {
						errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "Could not create the requested resource");
					} else {
						response.statusCode = 201;
						response.send(location);
					}
				}, homeObject, "_id");
			}
		}
	})
	.get(function (request, response) {

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

		connector.getHomes(function (err, homes) {
			if (err) {
				errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "Could not fetch homes.");
			} else {
				if (homes.length > 0) {
					connector.getCollectionCount(function (err, collectionSize) {

						homes = Utility.getFormattedResponse(homes);
						homes.data.collection_size = collectionSize;
						if (collectionSize > elementCount) {
							homes.data.pages = [];
							var lastPage = collectionSize / elementCount;
							if (page < lastPage) {
								homes.data.pages.push(Utility.getNextPage(request.url, page + 1, elementCount));
							}
							if (page > 1) {
								homes.data.pages.push(Utility.getPreviousPage(request.url, page - 1, elementCount));
							}
						}
						response.status(200).json(homes);
					}, "home");
				} else {
					errorResponse.sendErrorResponse(response, 404, "Not Found", "There are no homes in the System.");
				}
			}
		}, filters, "collection", paginationConfig, sort_config);
	});

router.route('/homes/:home_id')
	.put(function (request, response) {
		var homeObject = request.body;
		connector.updateHome(function (err, location) {
			if (err) {
				errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The Home entity could not be updated");
			} else {
				response.statusCode = 200;
				response.setHeader('content-type', 'application/json');
				response.send(location);
			}
		}, homeObject, request.params.home_id, "_id");
	})
	.get(function (request, response) {
		connector.getHomes(function (err, home) {
			if (err) {
				errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found");
			} else {

				if (home) {
					response.statusCode = 200;
					response.setHeader('content-type', 'application/json');
					response.send(Utility.getFormattedResponse(home));
				} else {
					errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found");
				}
			}
		}, {
			_id: request.params.home_id
		}, "_id");
	}).delete(function (request, response) {

	connector.deleteHome(function (err) {
		if (err) {
			errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The requested operation cannot be done.");
		} else {
			response.status(204).send();
		}
	}, request.params.home_id)
});

module.exports = router;