var express = require('express');
var router = express.Router();

/* GET home page. */
router.route('/')
    .get(function(request, response) {
      var welcomeMsg = {
        message: "Welcome to HILE"
      };
      response.json(welcomeMsg);
    });

module.exports = router;
