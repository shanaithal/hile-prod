var express = require('express');
var router = express.Router();
var connector = new require('../utilities/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();
var multiparty = require('multiparty');

router.route('/products/:product_id/images')
	.post(function (request, response) {

		var form = new multiparty.Form();
		var entity_info = {};
		entity_info.type = "product";
		entity_info.id = request.params.product_id;

		form.on('file', function (name, file) {

			if (file.originalFileName !== "") {
				connector.uploadImage(function (err, location) {

					if (err) {

						errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The requested resource could not be uploaded");
					} else {

						response.status(201).json(location);
					}
				}, file.path, entity_info);
			}
		});

		form.parse(request);
	});

router.route('/images')
	.get(function (request, response) {

		var filters = Utility._getFilters(request.query);
		connector.getImages(function (err, images) {

			if (err) {

				errorResponse.sendErrorResponse(response, 404, "Not Found", "No Images found in the system.");
			} else {

				response.status(200).json(Utility.getFormattedResponse(images));
			}
		}, filters, "collection");
	});

router.route('/images/:image_id')
	.put(function (request, response) {

		var form = new multiparty.Form();
		var imageId = request.params.image_id;

		form.on('file', function (name, file) {

			if (file.originalFileName !== "") {
				connector.upDateImage(function (err, location) {

					if (err) {

						console.log(err);
						errorResponse.sendErrorResponse(response, 500, "Internal Server Error", "The requested resource could not be uploaded");
					} else {

						response.status(204).json(location);
					}
				}, file.path, imageId);
			}
		});

		form.parse(request);
	})
	.get(function (request, response) {

		var image_id = request.params.image_id;
		connector.getImages(function (err, image) {

			if (err) {

				errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested Image not found");
			} else {

				response.status(200).json(Utility.getFormattedResponse(image));
			}
		}, {_id: image_id}, "_id");
	});

module.exports = router;
