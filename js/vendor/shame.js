/*
 * Shame.js
 *
 * The island of misfit code...
 */


/* Capitalize the first letter of a string
 * "hello there".capitalize() => "Hello there"
 */
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.substring(1);
};

/* Capitalize every word in a string
 * "hello there".titleize() => "Hello There"
 *
 * Added here for Rickshaw tooltip titles
 */
String.prototype.titleize = function() {
  return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); });
};

/* Check if an array has any elements
 * @return {boolean} are there any elements?
 */
Array.prototype.any = function() {
  return (this.length > 0);
};

/* Get the last element of an array
 * @return mixed
 */
Array.prototype.last = function() {
	return this[this.length - 1]
};

/* Create a clone of an object
 * http://jsperf.com/cloning-an-object/2
 * @return object
 */
Object.clone = function(object) {
	var clone = (object instanceof Array) ? [] : {};
	for(var key in object) {
		if(object.hasOwnProperty(key)) {
			clone[key] = object[key];
		}
	}
	return clone;
};

/*
 * Take object & prepare as URL params
 * @param {obj} obj
 * @returns {String}
 */
Object.param = function(obj){

	var str = '';
	for (var o in obj){
		if(obj.hasOwnProperty(o))
			str += o + '=' + obj[o] + '&';
	}
	return str;

};

// Copyright (c) 2012 Sutoiku, Inc. (MIT License)
// https://gist.github.com/ghalimi/4591338
Math.IRR = function(values, guess) {
	// Credits: algorithm inspired by Apache OpenOffice

	// Calculates the resulting amount
	var irrResult = function(values, dates, rate) {
		var r = rate + 1;
		var result = values[0];
		for (var i = 1; i < values.length; i++) {
			result += values[i] / Math.pow(r, (dates[i] - dates[0]) / 365);
		}
		return result;
	}

	// Calculates the first derivation
	var irrResultDeriv = function(values, dates, rate) {
		var r = rate + 1;
		var result = 0;
		for (var i = 1; i < values.length; i++) {
			var frac = (dates[i] - dates[0]) / 365;
			result -= frac * values[i] / Math.pow(r, frac + 1);
		}
		return result;
	}

	// Initialize dates and check that values contains at least one positive value and one negative value
	var dates = [];
	var positive = false;
	var negative = false;
	for (var i = 0; i < values.length; i++) {
		dates[i] = (i === 0) ? 0 : dates[i - 1] + 365;
		if (values[i] > 0) positive = true;
		if (values[i] < 0) negative = true;
	}

	// Return error if values does not contain at least one positive value and one negative value
	if (!positive || !negative) return '#NUM!';

	// Initialize guess and resultRate
	var guess = (typeof guess === 'undefined') ? 0.1 : guess;
	var resultRate = guess;

	// Set maximum epsilon for end of iteration
	var epsMax = 1e-10;

	// Set maximum number of iterations
	var iterMax = 50;

	// Implement Newton's method
	var newRate, epsRate, resultValue;
	var iteration = 0;
	var contLoop = true;
	do {
		resultValue = irrResult(values, dates, resultRate);
		newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
		epsRate = Math.abs(newRate - resultRate);
		resultRate = newRate;
		contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
	} while(contLoop && (++iteration < iterMax));

	if(contLoop) return '#NUM!';

	// Return internal rate of return
	return resultRate;
};

/* =============================================================================================================
 * Following are various implementation of Set Theory (http://en.wikipedia.org/wiki/Set_theory#Basic_concepts)
 * 
 * @source = src= https://code.google.com/p/javascriptsets/downloads/detail?name=array.sets.0.1.js&can=2&q=
 */
//Array.prototype.cartesian = function(a) {
//	var temp = [];
//	for (var i = 0; i < this.length; i++) {
//		for (var j = 0; j < a.length; j++) {
//			temp.push([this[i], a[j]]);
//		}
//	}
//
//	return temp;
//};			
//Array.prototype.complement = function(a) {
//	var keys = {};
//	var temp = [];
//	for (var i = 0; i < a.length; i++) {
//		if (a[i] !== undefined)
//			keys[a[i]] = 1;
//	}
//	for (var i = 0; i < this.length; i++) {
//		if (this[i] !== undefined && keys[this[i]] != undefined) {
//			keys[this[i]]--;
//		}
//	}
//	for (var key in keys) {
//		if (keys[key] > 0) {
//			temp.push(key);
//		}
//	}
//
//	return temp;
//};
//Array.prototype.difference = function(a) {
//	var temp = [];
//	var keys = {};
//	for (var i = 0; i < this.length; i++) {
//		if (this[i] !== undefined)
//			keys[this[i]] = 0;
//	}
//	for (var i = 0; i < a.length; i++) {
//		if (a[i] !== undefined)
//			keys[a[i]] = ++keys[a[i]] || 0; 
//	}
//	for (var key in keys) {
//		if (keys[key] === 0) {
//			temp.push(key);
//		}
//	}
//	return temp;
//};
//Array.prototype.intersection = function(a) {
//	var keys = {};
//	var temp = [];
//	var bigger = (this.length > a.length) ? this : a;
//	var smaller = (this.length > a.length) ? a : this;
//	for (var i = 0; i < smaller.length; i++) {
//		if (smaller[i] !== undefined)
//			keys[smaller[i]] = 1;
//	}
//	for (var i = 0; i < bigger.length; i++) {
//		if (bigger[i] !== undefined && keys[bigger[i]] !== undefined) {
//			keys[bigger[i]]++;
//		}
//	}
//	for (var key in keys) {
//		if (keys[key] === 2) {
//			temp.push(key);
//		}
//	}
//	return temp;
//};
//Array.prototype.powerset = function() {
//	// [x,y,z] => [[],[x],[y],[z],[x,y],[x,z],[y,z],[x,y,z]]
//	var temp = [];
//	var clone = [];
//	// iteration 0 - just add the empty set
//	temp.push([]);
//	// iteration 1 - add each individual element
//	for (var i = 0; i < this.length; i++) {
//		temp.push([this[i]]);
//	}
//	// iteration 2 - add each individual element, unioned with every other element
//	var clone = this.union([]);
//	while (clone.length > 0) {
//		var el = clone[0];
//		var others = clone.complement([el]);
//		for (var i = 0; i < others.length; i++) {
//			temp.push([el, others[i]]);
//		}
//		clone = others;
//	}
//	for (var i = 0; i < this.length; i++) {
//		// hmmmmmm, not quite....
//	}
//	// iteration 3 - add the original set
//	temp.push(this.union([]));
//	return temp;
//};
Array.prototype.union = function(a) {
	var keys = {};
	var temp = [];
	var bigger = (this.length > a.length) ? this : a;
	var smaller = (this.length > a.length) ? a : this;
	// build has table with smaller array
	for (var i = 0; i < smaller.length; i++) {
		if (smaller[i] !== undefined)
			keys[smaller[i]] = 1;
	}
	// loop over larger array checking hash table for matches
	for (var i = 0; i < bigger.length; i++) {
		if (bigger[i] !== undefined) {
			keys[bigger[i]] = 1;
		}
		
	}
	// convert hash table to array and return
	for (var key in keys) {
		temp.push(key);
	}

	return temp;
};
/* 
 * end of SET THEORY
 /* =============================================================================================================
 */ 
