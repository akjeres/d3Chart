window.addEventListener('load', () => {
    const svg = d3.select("svg"),
        margin = {top: 0, right: 0, bottom: 0, left: 0},
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
            const xAxis = d3.axisBottom(x).ticks();
            x.domain(d3.extent(dataToGenerateXAxis, function(d) { return d; }));
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            renderChart(dataToProceed, svg, {
                margin,
                width,
                height,
                tooltip,
                x,
                xAxis
            });

            document.forms[0].addEventListener('change', () => {
                renderChart(proceedData(dataToProceed), svg, {
                    margin,
                    width,
                    height,
                    tooltip,
                    x,
                    xAxis
                });
            });
        },
        error: (data) => {
            throw Error(data);
        },
    });
});

function renderChart(dataToProceed, svg, obj) {
    svg.selectAll(".line, .bar, .y, .focus, g:not([class])").remove();
    const { margin, width, height, tooltip, x, xAxis } = obj;
    const prop = 'First Line Data';
    const prop2 = 'Second Line Data';
    const prop3 = 'Arrows Data';
    const propForDirect = 'direct';
    const propForReverse = 'reverse';
    const directData = dataToProceed[prop3].filter((i) => propForDirect === i.type_of_rho);
    const reverseData = dataToProceed[prop3].filter((i) => propForReverse === i.type_of_rho);


    // Dates functs
    const bisectDate = d3.bisector(function(d) { return d.date; }).left;

    //Histogram
    histogram(directData, svg, {
        x,
        prop: propForDirect,
        height,
        color: '#0F0',
    });
    histogram(reverseData, svg, {
        x,
        prop: propForReverse,
        height,
        color: '#F00',
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
        color: '#fdd023',
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
            console.log(d3.event.transform);
            svg.selectAll(".x.axis").call(xAxis.ticks(Math.round(10 * d3.event.transform.k )));
            svg.selectAll('.line').each(function(d,i) {
                const currentLine = d3.select(this);
                const variable = currentLine.classed('line--0') ? chart0 : chart1;
                currentLine.datum(variable.data).attr('d', variable.line);
            });
            svg.selectAll('.bar').remove();
            histogram(directData, svg, {
                x,
                prop: propForDirect,
                height,
                color: '#0F0',
            });
            histogram(reverseData, svg, {
                x,
                prop: propForReverse,
                height,
                color: '#F00',
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
    const axisMenthod = leftCondition ? 'Right' : 'Left';
    const transformText = leftCondition ? 0 : -105;
    const transformAxe = leftCondition ? 0 : width - 1;

    const y = d3.scaleLinear().range([height, 0]);

    const yAxis = d3[`${axisPrefix}${axisMenthod}`](y);

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

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", `translate(${transformAxe}, 0)`)
        .call(yAxis)
        .append("text")
        .attr("transform", `rotate(-90) translate(0, ${transformText})`)
        .attr("y", 45)
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
    const { x, prop, height, color = "#5D6971" } = obj;

    const bars = svg.selectAll(`.bar--${prop}`);
    const axeX = '.x.axis';

    bars.data(rawData)
        .enter().insert("rect", axeX)
        .attr("class", `bar bar--${prop}`)
        .attr("fill", color)
        .attr("x", function(d) { return x(new Date(d.min_period_id)); })
        .attr("width", function(d) {
            return (x(new Date(d.max_period_id)) - x(new Date(d.min_period_id)));
        })
        .attr("y", function(d) { return 0; })
        .attr("height", function(d) { return height; });
}

function proceedData(obj) {
    this.counter = 0;
    if ('object' !== typeof obj) return obj;

    const first  = 'First Line Data';
    const second = 'Second Line Data';
    const arrow  = 'Arrows Data';

    const form = document.forms[0];
    const flags = {};
    Array.prototype.forEach.call(form.elements, (i) => {
        flags[i.name] = i.checked;
    });

    const result = Object.assign({}, obj);
    let arrowsData = [];
    if (!flags[first]) delete result[first];
    if (!flags[second]) delete result[second];

    if (arrow in obj) {
        arrowsData = obj[arrow].filter(i => {
            switch (i.type_of_rho) {
                case 'direct':
                    return !!flags.direct;
                    break;
                case 'reverse':
                    return !!flags.reverse;
                    break;
                default:
                    return true;
                    break;
            }
        });
    }
    result[arrow] = arrowsData;

    return result;
}