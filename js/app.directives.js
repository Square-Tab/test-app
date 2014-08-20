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
								};

								width 	= width > 0 ? width : $('#' + attrs.id).parent().parent().width() / 2;
								height 	= height > 0 ? height : $('#' + attrs.id).parent().parent().height() / 2;
								height 	= height > 0 ? height : width;

								//draw circle
								var arc = d3.svg.arc()
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
						var id 			= $attrs.id ? $attrs.id : 'donutpie' + $scope.$id,
							legend 		= $attrs.legend,
							series 		= $scope.series,
							color 		= d3.scale.category20(),
							data		= [];

						var	width 		= $('#' + $attrs.id).parent().parent().width();
							height 		= width / 1.5;

						var radius 			= Math.min(width, height) / 4,
							innerRadius		= ( radius / 2 ),
							textOffset 		= 14,
							tweenDuration 	= 500,
							lines,
							valueLabels,
							nameLabels,
							streakerDataAdded,
							arraySize,
							pieData			= [],
							oldPieData		= [],
							filteredPieData	= [],
							donut 			= d3.layout.pie().value(function(d) {
								return d.value;
							});

						var arc = d3.svg.arc()
									.startAngle (function ( d ) { return d.startAngle; })
									.endAngle (function ( d ) { return d.endAngle; })
									.innerRadius ( innerRadius )
									.outerRadius ( radius );

						/**
						 * Create VIS and Groups
						 */
						var vis = d3.select($element[0]).append("svg:svg")
									  .attr("width", width)
									  .attr("height", height);

						//GROUP FOR ARCS/PATHS
						var arc_group = vis.append("svg:g")
										  .attr("class", "arc")
										  .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

						//GROUP FOR LABELS
						var label_group = vis.append("svg:g")
											  .attr("class", "label_group")
											  .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

						//GROUP FOR CENTER TEXT  
						var center_group = vis.append("svg:g")
											  .attr("class", "center_group")
											  .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

						//PLACEHOLDER GRAY CIRCLE
						var paths = arc_group.append("svg:circle")
									    .attr("fill", "#EFEFEF")
									    .attr("r", radius);

						//WHITE CIRCLE BEHIND LABELS
						var whiteCircle = center_group.append("svg:circle")
											  .attr("fill", "white")
											  .attr("r", innerRadius);

						$scope.$watch ( 'series', function ( series ) {
							
							arraySize 			= series.length;
  							streakerDataAdded 	= series;

  							oldPieData 			= filteredPieData;
  							pieData 			= donut (streakerDataAdded);

  							// Remove stuff
  							if (series.length <= 0) {
  								arc_group.selectAll("path").remove();
  								label_group.selectAll("line").remove();
  								label_group.selectAll("text.value").remove();
  								label_group.selectAll("text.units").remove();

  								//PLACEHOLDER GRAY CIRCLE
								var paths = arc_group.append("svg:circle")
											    .attr("fill", "#EFEFEF")
											    .attr("r", radius);

								//WHITE CIRCLE BEHIND LABELS
								var whiteCircle = center_group.append("svg:circle")
													  .attr("fill", "white")
													  .attr("r", innerRadius);
  							}

  							var totalOctets = 0;
							filteredPieData = pieData.filter(filterData);
							function filterData (element, index, array) {
						    	element.name 	= streakerDataAdded[index].name;
							    element.value 	= streakerDataAdded[index].value;
							    totalOctets 	+= element.value;
							    return (element.value > 0);
						  	}

  							// oldPieData 	= filteredPieData;

						  	// Filtereted Data
						  	if (filteredPieData.length > 0 && oldPieData.length > 0) {
						  		//REMOVE PLACEHOLDER CIRCLE
    							arc_group.selectAll("circle").remove();

    							//DRAW ARC PATHS
							    paths = arc_group.selectAll("path").data(filteredPieData);
							    paths.enter().append("svg:path")
							      .attr("stroke", "white")
							      .attr("stroke-width", 0.5)
							      .attr("fill", function(d, i) { return color(i); })
							      .transition()
							        .duration(tweenDuration)
							        .attrTween("d", pieTween);
							    paths
							      .transition()
							        .duration(tweenDuration)
							        .attrTween("d", pieTween);
							    paths.exit()
							      .transition()
							        .duration(tweenDuration)
							        .attrTween("d", removePieTween)
							      .remove();

							    //DRAW TICK MARK LINES FOR LABELS
							    lines = label_group.selectAll("line").data(filteredPieData);
							    lines.enter().append("svg:line")
							      .attr("x1", 0)
							      .attr("x2", 0)
							      .attr("y1", -radius-3)
							      .attr("y2", -radius-8)
							      .attr("stroke", "gray")
							      .attr("transform", function(d) {
							        return "rotate(" + (d.startAngle+d.endAngle)/2 * (180/Math.PI) + ")";
							      });
							    lines.transition()
							      .duration(tweenDuration)
							      .attr("transform", function(d) {
							        return "rotate(" + (d.startAngle+d.endAngle)/2 * (180/Math.PI) + ")";
							      });
							    lines.exit().remove();

							    //DRAW LABELS WITH PERCENTAGE VALUES
							    valueLabels = label_group.selectAll("text.value").data(filteredPieData)
							      .attr("dy", function(d){
							        if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
							          return 5;
							        } else {
							          return -7;
							        }
							      })
							      .attr("text-anchor", function(d){
							        if ( (d.startAngle+d.endAngle)/2 < Math.PI ){
							          return "beginning";
							        } else {
							          return "end";
							        }
							      })
							      .text(function(d){
							        var percentage = (d.value/totalOctets)*100;
							        return percentage.toFixed(1) + "%";
							      });

							      valueLabels.enter().append("svg:text")
								      .attr("class", "value")
								      .attr("transform", function(d) {
								        return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (radius+textOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (radius+textOffset) + ")";
								      })
								      .attr("dy", function(d){
								        if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
								          return 5;
								        } else {
								          return -7;
								        }
								      })
								      .attr("text-anchor", function(d){
								        if ( (d.startAngle+d.endAngle)/2 < Math.PI ){
								          return "beginning";
								        } else {
								          return "end";
								        }
								      }).text(function(d){
								        var percentage = (d.value/totalOctets)*100;
								        return percentage.toFixed(1) + "%";
								      });

							    valueLabels.transition().duration(tweenDuration).attrTween("transform", textTween);

							    valueLabels.exit().remove();


							    //DRAW LABELS WITH ENTITY NAMES
							    nameLabels = label_group.selectAll("text.units").data(filteredPieData)
							      .attr("dy", function(d){
							        if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
							          return 17;
							        } else {
							          return 5;
							        }
							      })
							      .attr("text-anchor", function(d){
							        if ((d.startAngle+d.endAngle)/2 < Math.PI ) {
							          return "beginning";
							        } else {
							          return "end";
							        }
							      }).text(function(d){
							        return d.name;
							      });

							    nameLabels.enter().append("svg:text")
							      .attr("class", "units")
							      .attr("transform", function(d) {
							        return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (radius+textOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (radius+textOffset) + ")";
							      })
							      .attr("dy", function(d){
							        if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
							          return 17;
							        } else {
							          return 5;
							        }
							      })
							      .attr("text-anchor", function(d){
							        if ((d.startAngle+d.endAngle)/2 < Math.PI ) {
							          return "beginning";
							        } else {
							          return "end";
							        }
							      }).text(function(d){
							        return d.name;
							      });

							    nameLabels.transition().duration(tweenDuration).attrTween("transform", textTween);

							    nameLabels.exit().remove();

						  	} // EOF Filtered Data

						  	function pieTween(d, i) {
								var s0;
								var e0;
								if(oldPieData[i]){
									s0 = oldPieData[i].startAngle;
									e0 = oldPieData[i].endAngle;
								} else if (!(oldPieData[i]) && oldPieData[i-1]) {
									s0 = oldPieData[i-1].endAngle;
									e0 = oldPieData[i-1].endAngle;
								} else if(!(oldPieData[i-1]) && oldPieData.length > 0){
									s0 = oldPieData[oldPieData.length-1].endAngle;
									e0 = oldPieData[oldPieData.length-1].endAngle;
								} else {
									s0 = 0;
									e0 = 0;
								}
								var i = d3.interpolate({startAngle: s0, endAngle: e0}, {startAngle: d.startAngle, endAngle: d.endAngle});
								return function(t) {
									var b = i(t);
									return arc(b);
								};
							}

							function removePieTween(d, i) {
							  s0 = 2 * Math.PI;
							  e0 = 2 * Math.PI;
							  var i = d3.interpolate({startAngle: d.startAngle, endAngle: d.endAngle}, {startAngle: s0, endAngle: e0});
							  return function(t) {
							    var b = i(t);
							    return arc(b);
							  };
							}

							function textTween(d, i) {
							  var a;
							  if(oldPieData[i]){
							    a = (oldPieData[i].startAngle + oldPieData[i].endAngle - Math.PI)/2;
							  } else if (!(oldPieData[i]) && oldPieData[i-1]) {
							    a = (oldPieData[i-1].startAngle + oldPieData[i-1].endAngle - Math.PI)/2;
							  } else if(!(oldPieData[i-1]) && oldPieData.length > 0) {
							    a = (oldPieData[oldPieData.length-1].startAngle + oldPieData[oldPieData.length-1].endAngle - Math.PI)/2;
							  } else {
							    a = 0;
							  }
							  var b = (d.startAngle + d.endAngle - Math.PI)/2;

							  var fn = d3.interpolateNumber(a, b);
							  return function(t) {
							    var val = fn(t);
							    return "translate(" + Math.cos(val) * (radius+textOffset) + "," + Math.sin(val) * (radius+textOffset) + ")";
							  };
							}

						});

					}
				}
			}
		])

		/**
		 * DonutPie
		 */
		.directive('donutpieOld', [
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
										value: serie.value,
										color: serie.color ? serie.color : null
									});
							});

							if ( !$attrs.id )
								$element[0].id = id; // Set element id property if not given

							var width 			= options.width,
								height 			= options.height;

								width 	= width > 0 ? width : $('#' + attrs.id).parent().parent().width() / 2;
								height 	= height > 0 ? height : $('#' + attrs.id).parent().parent().height() / 2;
								height 	= height > 0 ? height : width;

							var	radius 			= Math.min(width, height) / 2,
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
					                .attr("fill", function(d, i) {
					                	if ( data[i].hasOwnProperty('color') && !!data[i].color )
					                		return data[i].color;

					                	return color(i);
					                }) //set the color for each slice to be chosen from the color function defined above
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