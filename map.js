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

/****** // Tooltip
    var tip = d3.tip()
      .attr('class', 'map-tooltip')
      .html(createTooltip);
//  uncomment line 83 to call this function
*************/

/****** // Zoom functionality
	var zoom = d3.behavior.zoom()
    .scale(projection.scale() * 2 * Math.PI)
    .scaleExtent([1 << 12, 1 << 25])
    // San Francisco - 37.7524/-122.4407
    .translate(projection([-122.4407, 37.7524]).map(function(x) { return -x; }))
    .on("zoom", zoomed);
//  uncomment line 84 to call zoom function    
*************/ 

	var svg = d3.select('#map').append('div').classed('svg-container', true)
        .append('svg')
          .attr('viewBox', '0 0 '+self.width+' '+self.height)
          .attr('preserveAspectRatio', 'xMidYMid')
          .classed('svg-content-responsive', true)

    svg.call(renderTiles)
//	  .call(renderLegend);
//	  .call(tip)
//    .call(zoom);

	// separate objects based on how they will be styled and 
	// put different class names in the second argument of this function call.
	// call as many times as needed
	renderJson(svg, self.json1, 'overlay1');
//	renderJson(svg, self.json2, 'overlay2');

/****** // More Zoom Functionality
	var zoom_controls = svg.append("div")
	    .attr("class", "zoom-container");

	var zoom_in = zoom_controls.append("a")
	    .attr("class", "zoom")
	    .attr("id", "zoom_in")
	    .text("+");

	var zoom_out = zoom_controls.append("a")
	    .attr("class", "zoom")
	    .attr("id", "zoom_out")
	    .text("-");

	zoomed();
*************/ 

	
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
  function renderJson (svg, json, className) {
      // render json data on map

      svg.append("g")
            .selectAll("path")
            .data(json.features)
            .enter().append("path")
            .attr('class', className)
            .attr("d", path);
    //  .on('mouseover', tip.show)
    //  .on('mouseout', tip.hide);
  }
/***
  function zoomed() {
	  var tiles = tiler
	      .scale(zoom.scale())
	      .translate(zoom.translate())
	      ();

	  projection
	      .scale(zoom.scale() / 2 / Math.PI)
	      .translate(zoom.translate());

	  var image = svg
	      .style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
	    .selectAll(".tile")
	      .data(tiles, function(d) { return d; });

	  image.exit()
	      .each(function(d) { this._xhr.abort(); })
	      .remove();

	  image.enter().append("svg")
	      .attr("class", "tile")
	      .style("left", function(d) { return d[0] * 256 + "px"; })
	      .style("top", function(d) { return d[1] * 256 + "px"; })
	      .each(window.renderTiles);
  }
 *****/
}

// PUT DATA IN THESE VARIABLES
App.Map.json1 = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -122.43206977844237,
              37.7916084854395
            ],
            [
              -122.42013931274413,
              37.793778925645704
            ],
            [
              -122.41627693176268,
              37.78177287927109
            ],
            [
              -122.4440860748291,
              37.776074412060694
            ],
            [
              -122.43206977844237,
              37.7916084854395
            ]
          ]
        ]
      }
    }
  ]
}

App.Map.json2 = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -122.45052337646486,
              37.77356423357254
            ],
            [
              -122.43061065673827,
              37.74940789133212
            ],
            [
              -122.41104125976564,
              37.76053707395284
            ],
            [
              -122.42340087890624,
              37.7754638359482
            ],
            [
              -122.45052337646486,
              37.77356423357254
            ]
          ]
        ]
      }
    }
  ]
}