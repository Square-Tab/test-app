(function(window, angular) {
		
	angular.module('SmartCalculatorApp')

		.factory('removeComma',
			function() {
			    return function(value) {
			        return parseFloat(value.replace(',', ''));
			    };
			}
		)

		/**
		 * Format number to display with thousands seperated comma
		 * 
		 * @method calcFormatNumber
		 * @returns String
		 */
		.factory('calcFormatNumber',
			function() {
			    rgc = function(convertString) {
			        if (convertString.substring(0, 1) == ",") {
			            return convertString.substring(1, convertString.length)
			        }
			        return convertString;
			    };

			    return function(value) {
			        var num = value.toString().replace(/[^0-9\.]+/g, '').replace(/,/gi, "").split("").reverse().join("");
			        var num2 = rgc(num.replace(/(.{3})/g, "$1,").split("").reverse().join(""));
			        return num2;
			    };
			}
		)

		/**
		 * Round number with two or given decimal places
		 * 
		 * @method preciseNumber
		 * @returns Decimal
		 */
		.factory('preciseNumber',
			function() {
			    return function(num, decimals) {
			        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
			    };
			}
		)

		/**
		 * Check if given value is numeric for validation
		 * 
		 * @method isNumeric
		 * @returns Boolean
		 */
		.factory('isNumeric',
			function() {
			    return function(n) {
			        var regexp = /^[\d,\.]+$/;
			        return n.length === undefined || regexp.test(n.toString());
			    };
			}
		)

	;
	
})(window, angular);