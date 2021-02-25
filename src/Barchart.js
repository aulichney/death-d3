import d3 from "d3";
import { useEffect } from "react";
import {parseDate, formatDate, formatDay} from "./useData";

const height = window.outerHeight/2, width = window.outerWidth/2;
const margin = {top: 10, right: 30, bottom: 30, left: 40};
const bar_margin_percent = 0.8;

//Capitalizes first letter, lowercases all of the rest
function textFormat(string) {
	var temp = string.toLowerCase();
  	return temp.charAt(1).toUpperCase() + temp.slice(2);
}

//Finds the average of an array
function average(d){
	var sum = 0;

    for(var i = 0; i < d.length; i++) {
    	sum += d[i].length;
    }

    return sum/d.length;
}

const drawChart = (data, bin) => {

	//Appends SVG to page
	var svg = d3.select("div#chart")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform",
		  "translate(" + margin.left + "," + margin.top + ")");

    //Parses CSV file dates
    data.forEach((d) => {
    	d.date = parseDate(d["DateOfDeath"]);
    });

    //Scaler for the Y axis, bounds defined later
	var yScale = d3.scaleLinear()
		.range([height,0])
		.nice();

		//Scaler for the Y axis, bounds defined later /*added
	var yScale2 = d3.scaleLinear()
		.range([height,0])
		.nice();

	//Scaler for the X axis, based off of min + max dates
	var dateExtent = d3.extent(data, (data) => data.date);
	var xScale = d3.scaleTime()
		.domain(dateExtent)
		.range([0,width])
		.nice();

	//Empty divs to be populated in update() /*added
    var yAxis = svg.append("g");
		var yAxis2 = svg.append("g");
    var xAxis = svg.append("g");

    //Label for the X Axis
    svg.append("text")
	    .attr("transform",
	            "translate(" + (width/2) + " ," +
	                           (height + margin.top + 20) + ")")
	    .style("text-anchor", "middle")
	    .text("Date");

	//Lable for the Y Axis
	svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Total Number of Deaths 2");

	//Lable for the right Y Axis *added
	svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x",0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Average Age of Death");

    //Grouping div for bars
    var bars = svg.append("g");

    //Div for mean line
	var meanLine = svg.append("g")
		.attr("id", "meanLine");

	//TickManner: Interval for histogram binning
	let tickManner;
	switch(bin.toLowerCase()) {
		case "month":
			tickManner = d3.timeMonth;
			break;
		case "week":
			tickManner = d3.timeWeek;
			break;
		case "day":
			tickManner = d3.timeDay;
			break;
	}

	//Histogram Settings
	var histogram = d3.histogram()
    	.value((d) => d.date)
    	.domain(xScale.domain())
    	.thresholds(xScale.ticks(tickManner));

    //Binned Data
    var histData = histogram(data);

    //Sets bounds for Y Scale
    var deathExtent = d3.extent(histData, (d) => d.length);
    yScale.domain([0,deathExtent[1]]);

		//Sets bounds for  right Y Scale *added
    var avgExtent = d3.extent(histData, (d) => d.length);
    yScale.domain([0,avgExtent[1]]);

    //Propogates Y Axis
    yAxis
    	.transition()
    	.duration(1000)
    	.call(d3.axisLeft(yScale));

			//Propogates right Y Axis *added
	    yAxis2
	    	.transition()
	    	.duration(1000)
	    	.call(d3.axisRight(yScale));

    //Propogates X Axis
    xAxis
    	.attr("transform", `translate(0, ${height} )`)
		.call(d3.axisBottom(xScale).tickFormat(formatDate));

	//Selects existing bars
	var allBars  = bars.selectAll("rect")
		.data(histData);

	//Transitions + adds additional bars
	allBars.enter()
		.append("rect")
		//Mouseover function for text box and color shift.
		.on("mouseover", (d, i)=>{
			//Manipulates Text Box
			var allData = "Total Deaths from " + formatDay(d.x0) + " to " + formatDay(d.x1) +": "+ d.length + "<br/>" + "<br/>";
			for (var i = 0; i < d.length; i++){
			 	allData += textFormat(d[i].DeceasedFirstName) + " " + textFormat(d[i].DeceasedLastName) + " " + d[i].DateOfDeath + "<br/>";
			}
			d3.select("div.textbox").style("opacity", .9).html(allData);

			//Changes Color
			d3.select(event.currentTarget)
				.style("fill", "#005EFB");
        })

        //Resets bars on mouse out
        .on("mouseout", () =>{
        	d3.select(event.currentTarget)
			.style("fill", "#009FFA");
        })
		.merge(allBars)
		.attr("x", (d) => (xScale(d.x0) * (1+bar_margin_percent) /2 + xScale(d.x1)*((1 - bar_margin_percent)/2)))
		.attr("y", yScale(average(histData)))
        .attr("width", (d) => (xScale(d.x1) - xScale(d.x0))*bar_margin_percent)
        .attr("stroke", "rgb(0,0,0)")
        .style("fill", "#009FFA");

    allBars.enter()
    	.selectAll("rect")
    	.transition()
    	.duration(1000)
		.attr("y", d => yScale(d.length))
        .attr("height", d => height - yScale(d.length));

    //Removes excess bars
    allBars.exit().remove();

    //Removes existing mean line
    meanLine.selectAll("line").remove();

    //Draws new mean line
    meanLine.append("line")
    	.style("stroke", "black")
    	.attr("y1", yScale(average(histData)))
    	.attr("y2", yScale(average(histData)))
    	.attr("x1", 0)
    	.attr("x2", width);

};

export const Barchart = ({data, bin}) => {

	useEffect(() => {
		drawChart(data, bin);

		return (() => d3.selectAll("svg").remove())
	}, [bin]);

	return(
		<></>
	);
};
