window.addEventListener('load', () => {
    const svg = d3.select("svg"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        tooltip = { width: 180, height: 72, x: 10, y: -30 };

    $.ajax({
        url: "./files/data.json",
        method: "get",
        success: (dataToProceed) => {
            const dataToGenerateXAxis = dataToProceed['First Line Data'].map(i => (new Date(i.date)));
            const x = d3.scaleTime()
                .range([0, width]);
            const xAxis = d3.axisBottom(x);
            x.domain(d3.extent(dataToGenerateXAxis, function(d) { return d; }));

            let proceededData = dataToProceed;
            renderPlot(proceededData, svg, {
                margin,
                width,
                height,
                tooltip,
                x,
                xAxis
            });
        },
        error: (data) => {
            throw Error(data);
        },
    });
});

function renderPlot(dataToProceed, svg, obj) {
    svg.selectAll("*").remove();
    const { margin, width, height, tooltip, x, xAxis } = obj;
    const prop = 'First Line Data';
    const prop2 = 'Second Line Data';
    const prop3 = 'Arrows Data';
    const propForDirect = 'direct';
    const propForReverse = 'reverse';
    const directData = dataToProceed[prop3].filter((i) => {
        if (propForDirect === i.type_of_rho) return i;
    });
    const reverseData = dataToProceed[prop3].filter((i) => {
        if (propForReverse === i.type_of_rho) return i;
    });


    // Dates functs
    const bisectDate = d3.bisector(function(d) { return d.date; }).left;

    //Histogram
    histogram(directData, svg, {
        margin,
        width,
        height,
        color: '#0F0',
    });
    // Lines
    const chart0 = chart(dataToProceed[prop], svg, {
        margin,
        width,
        height,
        x,
        xAxis,
        prop,
        color: '#00f',
        axis: 'Left',
    });
    const chart1 = chart(dataToProceed[prop2], svg, {
        margin,
        width,
        height,
        x,
        xAxis,
        prop: prop2,
        color: '#aaa',
        axis: 'Right',
    });

    // Tooltip
    const focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("circle")
        .attr("r", 5);

    focus.append("rect")
        .attr("class", "tooltip")
        .attr("width", tooltip.width)
        .attr("height", tooltip.height)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    focus.append("text")
        .attr("class", "tooltip-name")
        .attr("x", 18)
        .attr("y", -2);

    focus.append("text")
        .attr("class", "tooltip-date-name")
        .attr("x", 18)
        .attr("y", 18)
        .text("Date:");

    focus.append("text")
        .attr("class", "tooltip-date")
        .attr("x", 70)
        .attr("y", 18);

    focus.append("text")
        .attr("x", 18)
        .attr("y", 38)
        .text("Value:");

    focus.append("text")
        .attr("class", "tooltip-likes")
        .attr("x", 70)
        .attr("y", 38);

    svg.on("mouseover", function() {
        const line = event.target.closest('.line');
        if (!line) return;
        focus.style("display", null);
    })
        .on("mouseout", function() {
            focus.style("display", "none");
        })
        .on("mousemove", mousemove)
        .call(zoom);

    function mousemove() {
        const line = event.target.closest('.line');
        if (!line) return;
        const dataToRestructurize = line.classList.contains('line--1') ? chart1 : chart0;
        const { data, x, y, color, prop } = dataToRestructurize;

        if (!data) return;

        const x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focus.select("circle").attr("fill", color);
        focus.attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")");
        focus.select(".tooltip-name").text(prop);
        focus.select(".tooltip-date").text(() => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
            const currDate = d.date;
            return `${months[currDate.getMonth()]} ${currDate.getDate()}, ${currDate.getFullYear()}`;
        });
        focus.select(".tooltip-likes").text(d.value.toFixed(4));
    }

    function zoom(svg) {
        const extent = [[margin.left, margin.top], [width - margin.right, height - margin.top]];

        svg.on("mousemove", null)
            .call(d3.zoom()
            .scaleExtent([1, 10])
            .translateExtent(extent)
            .extent(extent)
            .on("zoom", zoomed))
            .on("mousemove", mousemove);

        function zoomed() {
            x.range([0, width].map(d => d3.event.transform.applyX(d)));
            svg.selectAll(".x.axis").call(xAxis);
            svg.selectAll('.line').each(function(d,i) {
                const currentLine = d3.select(this);
                const variable = currentLine.classed('line--0') ? chart0 : chart1;
                currentLine.datum(variable.data).attr('d', variable.line);
            });
        }
    }
}

function chart(data, svg, obj) {
    const {
        margin,
        width,
        height,
        x,
        xAxis,
        prop,
        color = '#ccc',
        axis = 'Left',
    } = obj;

    if (!this.counter) {
        this.counter = 0;
    }

    if (!data) {
        return {
            counter: this.counter++,
        };
    }

    const axisPrefix = 'axis';
    const leftCondition = 'Left' === axis;
    const transformText = leftCondition ? 0 : 60;
    const transformAxe = leftCondition ? 0 : width;

    const y = d3.scaleLinear().range([height, 0]);

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

    svg.append("path")
        .datum(data)
        .attr("class", `line line--${this.counter}`)
        .attr("d", line)
        .attr('stroke', color)
        .select(function() {
                return this.previousElementSibling;
            })
        .select("path.domain")
        .attr("stroke", color);


    return {
        x,
        xAxis,
        y,
        yAxis,
        line,
        data,
        prop,
        color,
        counter: this.counter++,
    };
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