(function(window, angular) {

	angular.module('SmartCalculatorApp')

		/* orderBy, but with objects.
		 * http://justinklemm.com/angularjs-filter-ordering-objects-ngrepeat/
		 */
		.filter('orderObjectBy', function() {
			return function(items, field, reverse) {
				var filtered = [];
				angular.forEach(items, function(item) {
					filtered.push(item);
				});
				filtered.sort(function(a, b) {
					if (a[field] > b[field])
						return 1;
					if (a[field] < b[field])
						return -1;
					return 0;
				});
				if (reverse)
					filtered.reverse();
				return filtered;
			};
		})

		/*
		 * Checks that something is a valid number returns 0 if NaN to prevent "null" from being printed
		 *
		 * @param {number} input
		 * @param {number} fractionSize - specifies number of decimal places
		 */
		.filter('na', function($filter) {
			return function(input) {
				if (!input && input != 0)
					return "N/A";
				else
					return input;

			};
		})

		/*
		 * Checks that something is a valid number returns 0 if NaN to prevent "null" from being printed
		 *
		 * @param {number} input
		 * @param {number} fractionSize - specifies number of decimal places
		 */
		.filter('numCheck', function($filter) {
			return function(input, fractionSize) {
				if (isNaN(input))
					return $filter('number')(0, fractionSize);
				else
					return $filter('number')(input, fractionSize);

			};
		})

		/*
		 * Checks that something is a valid number returns 0 if NaN to prevent "null" from being printed
		 *
		 * @param {number} input
		 * @param {number} fractionSize - specifies number of decimal places
		 */
		.filter('currencyCheck', function($filter) {
			return function(input, fractionSize) {
				// var n = input.replace('$','').replace(',','');
				var num = parseFloat(input);
				//console.log(input);
				//console.log(num);
				if (isNaN(num) || typeof(num) === "undefined" )
					return $filter('currency')(0, fractionSize);
				else
					return $filter('currency')(num, fractionSize);

			};
		})

		/*
		 * Converts decimal to percent
		 * 
		 * @param {number} input
		 * @param {number} fractionSize - specifies number of decimal places
		 */
		.filter('percent', function($filter) {
			return function(input, fractionSize) {
				var percent = $filter('number')(input * 100, fractionSize);
				return percent + "%";
			};
		})

		/*
		 * Checks that percent value does not exceed 100%
		 *
		 * @param {number} input
		 * @param {number} fractionSize - specifies number of decimal places
		 */
		.filter('percentMax', function($filter) {
			return function(input, fractionSize) {
				if (input > 100)
					return $filter('number')(100, fractionSize);
				else
					return $filter('number')(input, fractionSize);
			};
		})


		/*
		 * Appends ordinal to number
		 *
		 * @param {number} input
		 */
		.filter('ordinal', function($filter) {
			return function(input) {
				if (isNaN(input))
					return "0th";
				else {
					var output = parseInt(input),
						string = output + "",
						end = string.substring(string.length - 2),
						ordinal = "th";
					if(0 > $.inArray(end, ["11", "12", "13"])) {
						switch(end[1] || end[0]){
							case "1":
								ordinal = "st";
								break;
							case "2":
								ordinal = "nd";
								break;
							case "3":
								ordinal = "rd";
								break;
						}
					}
					return $filter('number')(output, 0) + ordinal;
				}
			};
		})

		/*
		 * Formats a number with a percentage symbol
		 *
		 * @param {number} input
		 * @param {number} decimals - defaults to 2
		 */
		.filter('percentage', function($filter) {
			return function(input, decimals) {
				return $filter('number')(input, (decimals || 2)) + '%';
			};
		})

		/*
		 * Converts MySQL datetime formats to a format that angular's date filter will understand
		 *
		 */
		.filter('dateToISO', function() {
		  return function(input) {
		    input = new Date(input).toISOString();
		    return input;
		  };
		})

		.filter('isoToMS', function() {
		  return function(input) {
			var ms = Date.parse(input.replace(/-/g,"/"));
		    return ms;
		  };
		})

		.filter('startFrom', function() {
		    return function(input, start) {
		        start = +start; //parse to int
				if (input) {
					return input.slice(start);
				}
		    };
		})

		/*
		 * Uses Sugar JS to take two dates and create a human readable "time ago"
		 * http://sugarjs.com/dates
		 * @param (date) input
		 */

		.filter('humanTimeAgo', function() {
		  return function(input) {
		    var dt1 = Date.utc.create(input);
			var dt2 = new Date().getTime();
			var str = parseInt(((dt2 - dt1) / 1000)) + ' seconds ago';
			var ht = Date.create(str).relative();
			return ht;
		  };
		})

		/*
		 * Checks that a value is valid for output
		 *
		 * @param {number} input
		 */
		.filter('unknown', function() {
			return function(input) {
				if (input === null || typeof input === undefined || input === Infinity || input === '')
					return 'unknown';
				else
					return input;
			};
		});

})(window, angular);