(function(window, angular) {

	angular.module('SmartCalculatorApp')

		.directive('errorCheck', function() {
			return {
				restrict: 'A',
				//		require: 'ngModel',
				link: function(scope, element, attrs, ctrl) {
					scope.$watch(attrs.input, function(val){
						var regexp = /^[\d,\.]+$/;
						if (regexp.test(val) || val.length == 0){
							element.removeClass("error");
							element.parent().children().remove("span");
						} else {
							element.addClass("error");
							element.parent().children().remove("span");
							element.parent().prepend("<span class='errorText'>Only numeric values allowed  </span>").css({'float':'none'});
						}
					}, true);
				}
			};
		})

		/*
		 * Only allow certain characters to be typed.
		 * Does not currently prevent pasted characters
		 */
		.directive('allowedCharacters', function() {
			return {
				restrict: 'A',

				link: function(scope, element, attrs) {
					var pattern = new RegExp(attrs.allowedCharacters.replace(/([^\\])\//g,'\1'));
					element.on('keypress', function(e) {
						var character = String.fromCharCode(e.which || e.keyCode),
							modifier = (e.ctrlKey || e.metaKey); // Are they pressing ctrl or cmd?
						if (!pattern.test(character) && !modifier) // don't allow the keypress if it doesn't match, unless it's special
							e.preventDefault();
					});
				}
			};
		})

		/*
		 * Takes an INT, assigns a letter grade to it, and displays a donut chart
		 *  with letter grade in center
		 *  
		 * ==Necessary attributes:==
		 * @attribute [int}		value
		 * @attribute {string}	id
		 * @attribute {object}	options {name: string, color: hex, width: int, height: int, min: int, max: int}
		 *						
		 */
		.directive('donutchart', function($timeout) {
			return {
				restrict: "EA",
				link: function(scope, element, attrs) {
					var opts = scope.$eval(attrs.options);
					attrs.$observe('value', function(value) {
						if (value !== null && value !== undefined && value !== '') {
							$('#' + attrs.id).empty(); // Clean donut container

							var id = attrs.id,
								data = ( (value < opts.min) ? 0 : value) / 100,
								//SVG canvas - default is half the size of parent's width
								// width = angular.element ( element[0] ).parent()[0].offsetWidth,
								// height = angular.element ( element[0] ).parent()[0].offsetWidth,
								min = opts.min,
								max = opts.max,
								//data normalizer - Tau: http://tauday.com/tau-manifesto
								τ = 2 * Math.PI,
								//select color between red & green based on percent
								color = function getGreenToRed(percent) {
									r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
									g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
									return 'rgb(' + r + ',' + g + ',0)';
								};

							var width 	= width > 0 ? width : $('#' + attrs.id).parent().parent().width() / 2;
							var height 	= height > 0 ? height : $('#' + attrs.id).parent().parent().height() / 2;
							height 	= height > 0 ? height : width;

							var radius = Math.min(width, height) / 2;

								//draw circle
							var	arc = d3.svg.arc()
									// .innerRadius((height + width) / 7 + 10)//50
									// .outerRadius((height + width) / 5 + 10)//65
									.innerRadius ( radius  * 0.7 )
									.outerRadius ( radius * 0.9 )
									.startAngle(0),

								//create svg
								svg = d3.select("#" + id).append("svg")
									.attr("width", width)
									.attr("height", height)
									// .attr("viewBox", "0 0 200 165")
									.append("g")
									.attr("transform", "translate(" + radius + "," + radius + ")"),

								//background color of circle
								background = svg.append("path")
									.datum({endAngle: τ})
									.style("fill", "#e8e8e8")
									.attr("d", arc),

								//foreground color of data
								foreground = svg.append("path")
									.datum({endAngle: .01 * τ})
									.attr("class", "gradePath")
									.style("fill", opts.color)
									.attr("d", arc),

								//Text for center of chart
								letterGradeText = svg.append("svg:text")
									.attr("class", "percent")
									.attr("dy", 8)
									.attr("text-anchor", "middle")
									.text( (value < min) ? 0 : value + '%'),

								letterGradeText = svg.append("svg:text")
									.attr("class", "remaining-text")
									.attr("dy", 15)
									.attr("text-anchor", "middle")
									.text('Remaining'),

								letterGradeText = svg.append("svg:text")
									.attr("class", "title-text")
									.attr("dy", -20)
									.attr("text-anchor", "middle")
									.text(opts.name);
								
							//call to arcTween() for transition
							// wrapped in a $timeout so the user has a chance to see the animation
							$timeout(function() {
								foreground.transition()
										.duration(750)
										.call(arcTween, data * τ);
							}, 1000);

							//Transition 
							function arcTween(transition, newAngle) {
								transition.attrTween("d", function(d) {
									var interpolate = d3.interpolate(d.endAngle, newAngle);
									return function(t) {
										d.endAngle = interpolate(t);
										return arc(d);
									};
								});
							}
						}
		//        return scope.letter;
					}); // end of scope.$observe
				} // end of link
			}; // end of return object
		}) // end of donutChart directive

	;

})(window, angular);