var App = App || {};

/*  =================================================
    UTILITIES
    =================================================

App.Utils = App.Utils || {};
App.Utils.slugify = function (text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

App.Utils.templatize = function (template, placeholder, obj) {
  //  Handlebars template selector, placehodler selector, data object
  //  Render Handlebars template
  var source = $(template).html(),
      hbs = Handlebars.compile( source );

  $(placeholder).html( hbs( obj ) );
};

*/

/*  =================================================
    MAP
    =================================================
*/
App.Map = App.Map || {
  width: 1000,
  height: 600,
  coordinates: [-122.50, 37.7520],
  rendered: false,
  currentId: 'locationsCount', // This acts as the default view for the choropleth
};

App.Map.load = function () {
    $('#map').html(''); // reset the map just in case a url clicks back from next article
	
	var self = this;
//	var slugify =  App.Utils.slugify;
//	var templatize = App.Utils.templatize;
	var layers = ['water', 'landuse', 'roads', 'buildings'];
  	var tiler = d3.geo.tile()
      .size([self.width, self.height]);

    var projection = d3.geo.mercator()
      .center(self.coordinates)
      .scale((1 << 20) / 2 / Math.PI)
      .translate([self.width / 2, self.height / 2]);

    var path = d3.geo.path()
      .projection(projection);

/****** Tooltip
    var tip = d3.tip()
      .attr('class', 'map-tooltip')
      .html(createTooltip);
//  uncomment line 84 to call this function
*************/

/****** Zoom functionality
	var zoom = d3.behavior.zoom()
    .scale(projection.scale() * 2 * Math.PI)
    .scaleExtent([1 << 12, 1 << 25])
    //San Francisco - 37.7524/-122.4407
    .translate(projection([-122.4407, 37.7524]).map(function(x) { return -x; }))
    .on("zoom", zoomed);
//  uncomment line 85 to call zoom function    
*************/ 

	var svg = d3.select('#map').append('div').classed('svg-container', true)
        .append('svg')
          .attr('viewBox', '0 0 '+self.width+' '+self.height)
          .attr('preserveAspectRatio', 'xMidYMid')
          .classed('svg-content-responsive', true)

    svg.call(renderTiles)
//	  .call(renderTopojson)
//	  .call(renderLegend);
//	  .call(tip)
//    .call(zoom);


function renderTiles (svg) {
    /* Hit Mapzen Vector Tile API for map data */
    svg.selectAll('g')
        .data(
          tiler.scale(projection.scale() * 2 * Math.PI)
          .translate(projection([0, 0]))
        )
      .enter().append('g')
        .each(function (d) {
          var g = d3.select(this);
          d3.json("http://vector.mapzen.com/osm/all/" + d[2] + "/" + d[0] + "/" + d[1] + ".json?api_key=vector-tiles-ZS0fz7o", function(error, json) {

            layers.forEach(function (layer) {
              var data = json[layer];
       
              if (data) {
                g.selectAll('path')
                    .data(data.features.sort(function(a, b) { return a.properties.sort_key - b.properties.sort_key; }))
                  .enter().append('path')
                    .attr('class', function (d) { return d.properties.kind; })
                    .attr('d', path);
              }
            });
          });
        });
  }
 }

/****** Example of data added on top of svg map

function renderTopojson (svg) {
    // Render topojson of SF Airbnb neighborhoods
    // Converted from KML for John Blanchard

    function build (json) {
      // render neighborhoods on map
      svg.append('g').selectAll('path')
        .data(topojson.feature(json, json.objects.neighborhoods).features)
      .enter().append('path')
        .attr('class', 'neighborhood')
        .attr('id', function (d) { return slugify(d.properties.name); })
        .attr('d', path)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
    }

    // Checking for cached JSON to keep network trips down
    if (!App.jsonCache) {
      // http://s3-us-west-1.amazonaws.com/sfc-airbnb/static/2015-07-02-sf-neighborhoods-airbnb.topojson
      d3.json('http://s3-us-west-1.amazonaws.com/sfc-airbnb/static/2015-07-12-sf-neighborhoods-airbnb.topojson', function (error, json) {
        if (error) { console.error(error); return error; }
        App.jsonCache = json;
        build( json );
        self.choropleth(svg, path, App.Map.currentId); // KICK OFF
      });
    } else {
      build( App.jsonCache );
      self.choropleth(svg, path, App.Map.currentId); // KICK OFF
    }
}
*************/ 
