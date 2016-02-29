var Buzz = require('../models/buzz');
var constants = require('../../utilities/constants');
var Utility = new require('../../utilities')();
var QueryBuilder = new require('../../utilities/query_builder')();
var fieldsOmittedFromResponse = {
    '__v': 0,
    'buzzedAt': 0
};

var BuzzDAO = function () {

    return Object.create(BuzzDAO.prototype);
};


BuzzDAO.prototype.updateBuzz = function (buzzObject, buzzId, callback) {

    Buzz.findOneAndUpdate({
            _id: buzzId,
        },
        {status: buzzObject.status},
        {new: true},
        function (err, buzz) {

            if (err) {

                callback(err);
            } else {

                if (buzz !== undefined && buzz !== null) {
                    callback(null, Utility.getLocation(buzz._id, constants.Buzz, constants.Updated, constants.Buzzes));
                } else {

                    callback({});
                }
            }
        }
    )
};

BuzzDAO.prototype.getBuzzes = function (filters, fetchType, paginationConfig, sortConfig, callback) {

    var query;
    switch (fetchType) {

        case constants.Id:

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

BuzzDAO.prototype.deleteBuzz = function (buzzId, callback) {

    Buzz.findOneAndRemove({_id: buzzId}, function (err) {

        if (err) {

            console.log(err);
            callback({
                code: 500,
                message: constants.INTERNAL_SERVER_ERROR,
                description: "Unknown DB error occurred while deleting the Buzz"
            });
        } else {

            callback(null);
        }
    });
};

module.exports = BuzzDAO;