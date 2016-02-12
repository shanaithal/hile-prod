var config = require('../config');
var fieldsOmittedFromResponse = {
	'__v': 0,
	'createdAt': 0
};

var QueryBuilder = function () {

	return Object.create(QueryBuilder.prototype);
};

QueryBuilder.prototype.build = function (query_object, search_terms, required_fields, sort_config, pagination_config) {

	var query = query_object.find(search_terms).select(required_fields);

	if (sort_config !== {} && sort_config !== undefined) {
		var sort_order = sort_config.order === 'ascending' ? 1 : -1;
		var sort_params = sort_config.sort_params;

		for (var index in sort_params) {
			var sort_object = {};
			sort_object[sort_params[index]] = sort_order;
			query = query.sort(sort_object);
		}
	}
	if (pagination_config !== undefined) {

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

		query.skip(pagination_config.skip).limit(pagination_config.limit);
	}

	return query.lean();
};

module.exports = QueryBuilder;