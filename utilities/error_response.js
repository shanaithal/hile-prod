var ErrorResponse = function () {
	var errorObject = Object.create(ErrorResponse.prototype);
	return errorObject;
};

ErrorResponse.prototype.sendErrorResponse = function (response, errorCode, errorMessage, errorDescription) {
	response.statusCode = errorCode;
	var errorResponse = {
		code: errorCode,
		message: errorMessage,
		description: errorDescription
	};
	response.status(errorCode).json(errorResponse);
};

module.exports = ErrorResponse;
