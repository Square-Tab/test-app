(function(window, angular) {

	angular.module('LTVCalculatorApp')

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
								width = opts.width ? opts.width : $("#" + id).parent().width() / 2,
								height = opts.height ? opts.height : width,
								min = opts.min,
								max = opts.max,
								//data normalizer - Tau: http://tauday.com/tau-manifesto
								τ = 2 * Math.PI,
								//select color between red & green based on percent
								color = function getGreenToRed(percent) {
									r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
									g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
									return 'rgb(' + r + ',' + g + ',0)';
								},

								//draw circle
								arc = d3.svg.arc()
									.innerRadius((height + width) / 7 + 10)//50
									.outerRadius((height + width) / 5 + 10)//65
									.startAngle(0),

								//create svg
								svg = d3.select("#" + id).append("svg")
									.attr("width", "100%")
									.attr("height", "35%")
									.attr("viewBox", "0 0 200 165")
									.append("g")
									.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),

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

		
		/**
		 * DonutPie
		 */
		.directive('donutpie', [
			function () {
				return {
					restrict: 	'EA',
					scope: 		{
						series: '='
					},
					link: 		function ( $scope, $element, $attrs ) {
						$scope.$watch('series', function ( series ) {
							var opts = {
								width: 	angular.element ( $element[0] ).parent()[0].offsetWidth,
								height: angular.element ( $element[0] ).parent()[0].offsetWidth
							},
							id 		= $attrs.id ? $attrs.id : 'donutpie' + $scope.$id,
							options	= $attrs.hasOwnProperty ( 'options' )
								? angular.extend ( $scope.$eval ( $attrs.options ), opts )
								: opts,
							legend 	= $attrs.legend,
							series 	= $scope.series,
							color 	= d3.scale.category20 (),
							data	= [];
						
							angular.forEach(series, function ( serie ) {
								if ( serie.value > 0 )
									data.push({
										label: serie.name,
										value: serie.value
									});
							});

							if ( !$attrs.id )
								$element[0].id = id; // Set element id property if not given

							var width 			= options.width,
								height 			= options.height,
								radius 			= Math.min(width, height) / 2,
								innerRadius 	= (radius / 2),
								outerRadius 	= (radius),
								
								svg 			= d3.select( $element[0] )
									        		.append("svg:svg")              	//create the SVG element inside the <body>
									        		.data( [data] )                  	//associate our data with the document
										            .attr( "width", width )     		//set the width and height of our visualization (these will be attributes of the <svg> tag
										            .attr( "height", height )
									        		.append("svg:g")                	//make a group to hold our pie chart
									            	.attr("transform", "translate(" + radius + "," + radius + ")");    //move the center of the pie chart from 0, 0 to radius, radius

						    var arc 			= d3.svg.arc()              //this will create <path> elements for us using arc data
								        			.innerRadius(innerRadius)
								        			.outerRadius(outerRadius);
						 
						    var pie 			= d3.layout.pie()           //this will create arc data for us given a list of values
						        					.value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array
						    
						    var arcs 			= svg.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
									        		.data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
											        .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
											        .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
											        .attr("class", "slice");    //allow us to style things in the slices (like text)
								
						        arcs.append("svg:path")
					                .attr("fill", function(d, i) { return color(i); } ) //set the color for each slice to be chosen from the color function defined above
					                .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function
								
					            arcs.append('text')
					            	.attr("transform", function(d) {
					            		var centroid = arc.centroid(d);
					            			centroid[0] = centroid[0] / 1.5;
					            		return "translate(" + centroid + ")";
					            	})
									// .attr("dy", ".35em")
									.style("text-anchor", "middle")
									.attr('class', 'slice-text')
									.text(function(d, i) { return data[i].label; });
						});
					}
				}
			}
		])

	;

})(window, angular);