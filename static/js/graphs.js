queue()
    .defer(d3.json, "static/data/Ethiopia-3W_Operational_Presence_August_2017.json")
    .defer(d3.json, "static/geojson/eth_region.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {
    var ethopia3W = projectsJson;

    var ndx = crossfilter(ethopia3W);

    // Define Dimensions
    var whoDim = ndx.dimension(function (d) {
        return d["Organization"];
    });
    var whatDim = ndx.dimension(function (d) {
        return d["Sector"];
    });
    var whereDim = ndx.dimension(function (d) {
        return d["Region"];
    });
    var statusDim = ndx.dimension(function (d) {
        return d["Project Status"]
    });

    // Calculate Metrics
    var all = ndx.groupAll();
    var numProjectsByWho = whoDim.group();
    var numProjectsByWhat = whatDim.group();
    var totalOrganizationsByState = whereDim.group().reduceSum(function (d) {
        return d["Organization"];
    });
    var numProjectsByStatus = statusDim.group();

    // The maximum donation in all states, the date of the first and last posts.
    var max_state = totalOrganizationsByState.top(1)[0].value;

    // charts
    var whoChart = dc.rowChart("#who-chart");
    var whatChart = dc.rowChart("#what-chart");
    var whereChart = dc.geoChoroplethChart("#where-chart");
    var statusChart = dc.pieChart("#status-chart")

    // chart parameters
    statusChart
        .width(300)
        .height(330)
        .dimension(statusDim)
        .group(numProjectsByStatus)
        .legend(dc.legend());


    whoChart
        .width(300)
        .height(330)
        .dimension(whoDim)
        .ordering(function (d) {
            return -1.0 * +d.value;
        })
        .group(numProjectsByWho).cap(8)
        .xAxis().ticks(4);

    whatChart
        .width(300)
        .height(330)
        .ordering(function (d) {
            return -1.0 * +d.value;
        })
        .dimension(whatDim)
        .group(numProjectsByWhat).cap(8)
        .xAxis().ticks(4);

    whereChart.width(1000)
        .height(330)
        .dimension(whereDim)
        .group(totalOrganizationsByState)
        .colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
        .colorDomain([0, max_state])
        .overlayGeoJson(statesJson["features"], "state", function (d) {
            return d.properties.regionname;
        })
        .projection(d3.geo.azimuthalEqualArea()
            .scale(1400)
            .translate([-730, 400]))
        .title(function (p) {
            return "State: " + p["key"]
                + "\n"
                + "Total Organizations: " + Math.round(p["value"]) + " $";
        })

    // rendering
    dc.renderAll();

};