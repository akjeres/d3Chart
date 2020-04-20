window.addEventListener('load', () => {
    const svg = d3.select("svg"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        tooltip = { width: 210, height: 70, x: 10, y: -30 };

    const x = d3.scaleTime()
              .range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    $.ajax({
        url: "./files/data.json",
        method: "get",
        success: (dataToProceed) => {
            svg.selectAll("*").remove();
            const prop = 'First Line Data';
            const prop2 = 'Second Line Data';
            const prop3 = 'Arrows Data';
            const propForDirect = 'direct';
            const propForReverse = 'reverse';
            /*const directData = dataToProceed[prop3].filter((i) => {
                if (propForDirect === i.type_of_rho) return i;
            });
            const reverseData = dataToProceed[prop3].filter((i) => {
                if (propForReverse === i.type_of_rho) return i;
            });

            //Histogram
            histogram(directData, svg, {
                margin,
                x,
                y,
                width,
                height,
                color: '#0F0',
            });*/
            // Lines
            chart(dataToProceed[prop], svg, {
                margin,
                x,
                y,
                width,
                height,
                prop,
                tooltip,
                color: '#00f',
                axis: 'Left',
            });
            chart(dataToProceed[prop2], svg, {
                margin,
                x,
                y,
                width,
                height,
                prop: prop2,
                color: '#aaa',
                axis: 'Right',
            });
        },
        error: (data) => {
            throw Error(data);
        },
    });
});

function chart(data, svg, obj) {
    const {
        margin,
        x,
        y,
        width,
        height,
        prop,
        color = '#ccc',
        axis = 'Left',
    } = obj;

    let counter = 0;
    const axisPrefix = 'axis';
    const leftCondition = 'Left' === axis;
    const transformText = leftCondition ? 0 : 60;
    const transformAxe = leftCondition ? 0 : width;
    const xAxis = d3.axisBottom(x);

    const yAxis = d3[`${axisPrefix}${axis}`](y);

    const line = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.value); });

    svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    data.forEach(function(d) {
        d.date = new Date(d.date);
        d.value = +d.value;
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain(d3.extent(data, function(d) { return d.value; }));

    const existingAxeX = svg.select('g.x');
    const axisXcondition = existingAxeX && existingAxeX._groups && existingAxeX._groups[0] && existingAxeX._groups[0][0];
    if (!axisXcondition) {
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    }

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", `translate(${transformAxe}, 0)`)
        .call(yAxis)
        .append("text")
        .attr("transform", `rotate(-90) translate(0, ${transformText})`)
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(prop)
        .attr("stroke", color);

    svg.select(".y path.domain")
        .attr("stroke", color);

    svg.append("path")
        .datum(data)
        .attr("class", `line line--${counter}`)
        .attr("d", line)
        .attr('stroke', color);

    counter++;
}

function histogram(rawData, svg, obj) {
    return;
    /*const { margin, x, y, width, height, color = "#5D6971" } = obj;
    const xMin = new Date('2010-01-01');
    const xMax = new Date('2019-04-18');

    x.domain([xMin, xMax]);
    console.log(rawData);
    console.log(x);
    var histogram = d3.histogram()
        .value(function(d) { return d.price; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(width / 80)); // then the numbers of bins
    console.log(histogram);*/
    mycolor = d3.rgb("#ffffff");  // Pass in Hex

    mycolor = d3.rgb(12, 67, 199);  // Red, Green, Blue
    mycolor = d3.hsl(0, 100, 50);  //  Hue-Saturation-Lightness  (e.g. red)
    mycolor = d3.hcl(-97, 32, 52);  // steelblue
    mycolor = d3.lab(52, -4, -32);  // Lab color space (l, a, b); steelblue

    // Make brighter and darker - Can be used for hovers
    darkercolor = mycolor.darker(0.1);
    lightercolor = mycolor.brighter(0.1);

    //////////  DISPLAY COLORS  //////////
    var svg = d3.select("svg")
        .attr({
            width: window.innerWidth,
            height: window.innerHeight
        });

    //var color = d3.scale.category10();  // d3 has built-in Colors
    //var color = d3.scale.category20();  // d3 has built-in Colors - Color Set 1
    //var color = d3.scale.category20b();  // d3 has built-in Colors - Color Set 2
    var color = d3.scale.category20c();  // d3 has built-in Colors - Color Set 3
    var dataset = d3.range(20);
    var barWidth = window.innerWidth / dataset.length;

    // Print out colors
    svg.selectAll("rect")
        .data(dataset)
        .enter()
        .append("rect")
        .attr({
            width: barWidth,
            height: height,
            y: 0,
            x: function (d, i) {
                return barWidth * i;
            },
            fill: color
        });
}