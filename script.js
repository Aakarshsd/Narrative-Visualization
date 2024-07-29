var scene1 = d3.select('#scene1');
var scene2 = d3.select('#scene2');
var scene3 = d3.select('#scene3');


var margin = { top: 10, right: 100, bottom: 50, left: 50 },
    width = 1000 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;


var x = d3.scaleBand().range([0, width]).padding(0.1);
var y = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom().scale(x);
var yAxis = d3.axisLeft().scale(y);


var tooltip = d3.select("body").append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "black")
    .style("border-radius", "5px")
    .style("padding", "15px")
    .style("color", "white");


Promise.all([
    d3.csv("data/NO2byNation.csv"),
    d3.csv("data/PM2.5 Concentration by Nation.csv")
]).then(([no2Data, pm25Data]) => {
    no2Data.forEach(d => {
        d['Avg. NO2 (μg/m3)'] = +d['Avg. NO2 (μg/m3)'];
    });
    pm25Data.forEach(d => {
        d['Avg. PM2.5 (μg/m3)'] = +d['Avg. PM2.5 (μg/m3)'];
    });

    drawScene1(no2Data, pm25Data);
});

function drawScene1(no2Data, pm25Data) {
    scene1.selectAll("*").remove();

    var regions = Array.from(new Set(no2Data.map(d => d['WHO Region'])));
    var regionData = regions.map(region => {
        return {
            region: region,
            avgNO2: d3.mean(no2Data.filter(d => d['WHO Region'] === region), d => d['Avg. NO2 (μg/m3)']),
            avgPM25: d3.mean(pm25Data.filter(d => d['WHO Region'] === region), d => d['Avg. PM2.5 (μg/m3)'])
        };
    }).filter(d => d.region);

    x.domain(regionData.map(d => d.region));
    y.domain([0, d3.max(regionData, d => Math.max(d.avgNO2, d.avgPM25))]);

    var svg = scene1.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.selectAll(".bar.no2")
        .data(regionData)
        .enter().append("rect")
        .attr("class", "bar no2")
        .attr("x", d => x(d.region))
        .attr("width", x.bandwidth() / 2)
        .attr("y", d => y(d.avgNO2))
        .attr("height", d => height - y(d.avgNO2))
        .attr("fill", "blue")
        .on("click", function(event, d) {
            var filteredData = no2Data.filter(dataItem => dataItem['WHO Region'] === d.region);
            drawScene2(filteredData, pm25Data.filter(dataItem => filteredData.map(f => f['WHO Country Name']).includes(dataItem['WHO Country Name'])), 'NO2', d.region);
            scene1.style('display', 'none');
            scene2.style('display', 'block');
        });

    svg.selectAll(".bar.pm25")
        .data(regionData)
        .enter().append("rect")
        .attr("class", "bar pm25")
        .attr("x", d => x(d.region) + x.bandwidth() / 2)
        .attr("width", x.bandwidth() / 2)
        .attr("y", d => y(d.avgPM25))
        .attr("height", d => height - y(d.avgPM25))
        .attr("fill", "red")
        .on("click", function(event, d) {
            var filteredData = pm25Data.filter(dataItem => dataItem['WHO Region'] === d.region);
            drawScene2(no2Data.filter(dataItem => filteredData.map(f => f['WHO Country Name']).includes(dataItem['WHO Country Name'])), filteredData, 'PM2.5', d.region);
            scene1.style('display', 'none');
            scene2.style('display', 'block');
        });

    
    svg.append('text')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 20)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Avg. Pollutant (μg/m³)');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .text('Region');

   
    var maxNO2 = d3.max(regionData, d => d.avgNO2);
    var minNO2 = d3.min(regionData, d => d.avgNO2);
    var maxPM25 = d3.max(regionData, d => d.avgPM25);
    var minPM25 = d3.min(regionData, d => d.avgPM25);

    var maxNO2Region = regionData.find(d => d.avgNO2 === maxNO2).region;
    var minNO2Region = regionData.find(d => d.avgNO2 === minNO2).region;
    var maxPM25Region = regionData.find(d => d.avgPM25 === maxPM25).region;
    var minPM25Region = regionData.find(d => d.avgPM25 === minPM25).region;

    
    svg.append("text")
        .attr("x", x(maxNO2Region))
        .attr("y", y(maxNO2) - 10)
        .attr("fill", "blue")
        .text(`Max NO2: ${maxNO2.toFixed(2)}`);

    svg.append("text")
        .attr("x", x(minNO2Region))
        .attr("y", y(minNO2) - 10)
        .attr("fill", "blue")
        .text(`Min NO2: ${minNO2.toFixed(2)}`);

    
    svg.append("text")
        .attr("x", x(maxPM25Region) + x.bandwidth() / 2)
        .attr("y", y(maxPM25) - 10)
        .attr("fill", "red")
        .text(`Max PM2.5: ${maxPM25.toFixed(2)}`);

    svg.append("text")
        .attr("x", x(minPM25Region) + x.bandwidth() / 2)
        .attr("y", y(minPM25) - 10)
        .attr("fill", "red")
        .text(`Min PM2.5: ${minPM25.toFixed(2)}`);
}

function drawScene2(no2Data, pm25Data, pollutant, region) {
    scene2.selectAll("*").remove();

    var filteredData = pollutant === 'NO2' ? no2Data : pm25Data;

    x.domain(filteredData.map(d => d['WHO Country Name']));
    y.domain([0, d3.max(filteredData, d => d[`Avg. ${pollutant} (μg/m3)`])]);

    var svg = scene2.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 50)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.selectAll(".bar")
        .data(filteredData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d['WHO Country Name']))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[`Avg. ${pollutant} (μg/m3)`]))
        .attr("height", d => height - y(d[`Avg. ${pollutant} (μg/m3)`]))
        .attr("fill", pollutant === 'NO2' ? 'blue' : 'red')
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d['WHO Country Name']}<br/>${pollutant}: ${d[`Avg. ${pollutant} (μg/m3)`]} μg/m³`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(event, d) {
            drawScene3([d], pm25Data.filter(dataItem => dataItem['WHO Country Name'] === d['WHO Country Name']));
            scene2.style('display', 'none');
            scene3.style('display', 'block');
        });

    svg.append('text')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 20)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text(`Avg. ${pollutant} (μg/m³)`);

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom + 20)
        .attr('text-anchor', 'middle')
        .text('Country');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top)
        .attr('text-anchor', 'middle')
        .attr('class', 'title')
        .text(`Pollutant Levels in ${region}`);
}

function drawScene3(no2Data, pm25Data) {
    scene3.selectAll("*").remove();

    var combinedData = no2Data.map(d => {
        var pm25Entry = pm25Data.find(p => p['WHO Country Name'] === d['WHO Country Name']);
        if (pm25Entry) {
            return {
                country: d['WHO Country Name'],
                no2: d['Avg. NO2 (μg/m3)'],
                pm25: pm25Entry['Avg. PM2.5 (μg/m3)']
            };
        }
        return null;
    }).filter(d => d !== null);

    var maxNO2 = d3.max(combinedData, d => d.no2);
    var maxPM25 = d3.max(combinedData, d => d.pm25);
    var maxPollutant = d3.max([maxNO2, maxPM25]);

    var y = d3.scaleBand().range([0, height]).padding(0.1).domain(combinedData.map(d => d.country));
    var x = d3.scaleLinear().range([0, width]).domain([0, maxPollutant * 1.1]);

    var svg = scene3.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 50)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y).tickFormat("").tickSize(0));

    svg.selectAll(".bar.no2")
        .data(combinedData)
        .enter().append("rect")
        .attr("class", "bar no2")
        .attr("x", 0)
        .attr("y", d => y(d.country))
        .attr("width", d => x(d.no2))
        .attr("height", y.bandwidth() / 2)
        .attr("fill", "blue");

    svg.selectAll(".bar.pm25")
        .data(combinedData)
        .enter().append("rect")
        .attr("class", "bar pm25")
        .attr("x", 0)
        .attr("y", d => y(d.country) + y.bandwidth() / 2)
        .attr("width", d => x(d.pm25))
        .attr("height", y.bandwidth() / 2)
        .attr("fill", "red");

    var legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, ${height + 30})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "blue");

    legend.append("text")
        .attr("x", 25)
        .attr("y", 15)
        .text("NO2");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 25)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "red");

    legend.append("text")
        .attr("x", 25)
        .attr("y", 40)
        .text("PM2.5");

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom + 40)
        .attr('text-anchor', 'middle')
        .text(`Pollutant Levels (μg/m³)`);

    svg.selectAll(".y.axis text")
        .attr("transform", "rotate(-90)")
        .attr("x", -9)
        .attr("y", 0)
        .attr("dy", ".35em")
        .style("text-anchor", "end");

    combinedData.forEach((d, i) => {
        svg.append('text')
            .attr('x', -height / 2)
            .attr('y', y(d.country) + y.bandwidth() / 4)
            .attr('transform', `rotate(-90, -${height / 2}, ${y(d.country) + y.bandwidth() / 4})`)
            .attr('text-anchor', 'middle')
            .text(d.country);
    });
}

// Event listeners to switch between scenes
document.getElementById('scene1-btn').addEventListener('click', () => {
    scene1.style('display', 'block');
    scene2.style('display', 'none');
    scene3.style('display', 'none');
    drawScene1(no2Data, pm25Data);
});

document.getElementById('scene2-btn').addEventListener('click', () => {
    scene1.style('display', 'none');
    scene2.style('display', 'block');
    scene3.style('display', 'none');
    drawScene2(no2Data, pm25Data, 'NO2', 'default');
});

document.getElementById('scene3-btn').addEventListener('click', () => {
    scene1.style('display', 'none');
    scene2.style('display', 'none');
    scene3.style('display', 'block');
    drawScene3(no2Data, pm25Data);
});



document.getElementById('scene1-btn').addEventListener('click', () => {
    scene1.style('display', 'block');
    scene2.style('display', 'none');
    scene3.style('display', 'none');
});

document.getElementById('scene2-btn').addEventListener('click', () => {
    scene1.style('display', 'none');
    scene2.style('display', 'block');
    scene3.style('display', 'none');
});

document.getElementById('scene3-btn').addEventListener('click', () => {
    scene1.style('display', 'none');
    scene2.style('display', 'none');
    scene3.style('display', 'block');
});
