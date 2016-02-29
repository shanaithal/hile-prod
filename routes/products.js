var express = require('express');
var router = express.Router();
var connector = new require('../db/dbconnector')();
var errorResponse = new require('../utilities/error_response')();
var Utility = new require('../utilities')();
var productDAO = new require('../db/connectors/product_dao')();

router.route('/products')
    .post(function (request, response) {

        var productObject = request.body;
        productDAO.createProduct(productObject, function (err, location) {

            if (err) {

                response.status(err.code).json(err);
            } else {

                response.status(201).json(location);
            }
        });
    }).get(function (request, response) {

    var page = parseInt(request.query.page);
    var elementCount = parseInt(request.query.count);
    var sort_params = request.query.sortby;
    var sort_order = request.query.order;
    if (!Utility.isArray(sort_params)) {
        sort_params = [sort_params];
    }
    var sort_config = {sort_params: sort_params, order: sort_order};
    var filters = Utility.getFilters(request.query);
    var paginationConfig = {};
    if (!isNaN(page) && !isNaN(elementCount)) {
        paginationConfig.skip = page;
        paginationConfig.limit = elementCount;
    }

    connector.getProducts(function (err, products) {
        if (err) {

            errorResponse.sendErrorResponse(response, 404, "Not Found", "The requested resource not found.");
        } else {

            if (isNaN(elementCount)) {

                page = 1;
                elementCount = products.length;
            }
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
    productDAO.updateProduct(productObject, productId, function (err, location) {

        if (err) {

            response.status(err.code).json(err);
        } else {

            response.status(204).json(location);
        }
    });
}).delete(function (request, response) {

    var productId = request.params.product_id;
    productDAO.deleteProduct(productId, function (err) {

        if (err) {

            response.status(err.code).json(err);
        } else {

            response.status(204).send();
        }
    });
});

module.exports = router;