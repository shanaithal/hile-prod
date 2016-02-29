var express = require('express');
var router = express.Router();
var connector = new require('../db/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();

router.route('/search')
	.get(function (request, response) {

		var queryObject = request.query;
		var entity = request.query.entity;
		var query = request.query.q;
		delete request.query.q;
		delete request.query.entity;
		var pageNumber = queryObject.page;
		var elementCount = queryObject.count;
		var sort_members = queryObject.sortby;
		var sort_order = queryObject.order;
		var sort_config = {sort_params: sort_members, order: sort_order};
		var filters = Utility.getFilters(queryObject);
		var pagination_config = {skip: pageNumber, limit: elementCount};

		connector.getSearchTerm(function (err, search_items, totalSearchResults) {

			if (err) {
				errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource could not be found");
			} else {

				search_items = Utility.getFormattedResponse(search_items);
				if (totalSearchResults > elementCount) {
					search_items.data.pages = [];
					var lastPage = totalSearchResults / elementCount;
					if (pageNumber < lastPage) {
						search_items.data.pages.push(Utility.getNextPage(request.url, parseInt(pageNumber) + 1, elementCount));
					}
					if (pageNumber > 1) {
						search_items.data.pages.push(Utility.getPreviousPage(request.url, parseInt(pageNumber) - 1, elementCount));
					}
				}

				search_items.data.collection_size =  totalSearchResults;
				response.status(200).json(search_items);
			}
		}, query, entity, filters, pagination_config);
		});

module.exports = router;