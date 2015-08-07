'use strict';


var App = App || {};



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
  currentNeighborhood: 'Alamo Square' // default for mobile map view
};

App.Map.load = function () {
  $('#map').html(''); // reset the map just in case a url clicks back from next article

  var self = this;
  var slugify =  App.Utils.slugify;
  var templatize = App.Utils.templatize;
  var layers = ['water', 'landuse', 'roads', 'buildings'];
  var tiler = d3.geo.tile()
      .size([self.width, self.height]);

  var projection = d3.geo.mercator()
      .center(self.coordinates)
      .scale((1 << 20) / 2 / Math.PI)
      .translate([self.width / 2, self.height / 2]);

  var path = d3.geo.path()
      .projection(projection);

  var tip = d3.tip()
      .attr('class', 'map-tooltip')
      .html(createTooltip);

  var svg = d3.select('#map').append('div').classed('svg-container', true)
        .append('svg')
          .attr('viewBox', '0 0 '+self.width+' '+self.height)
          .attr('preserveAspectRatio', 'xMidYMid')
          .classed('svg-content-responsive', true)

  svg.call(tip)
    .call(renderTiles)
    .call(renderTopojson)
    .call(renderLegend)
    .call(attribution);

  function createTooltip (d) {
    var data = self.getDatatable(d);
    var source = $('#tooltip-tmpl').html();
    var template = Handlebars.compile( source );
    return template( data );
  };

  function adjustChoroplethEvent () {
    $('.sfc-data-button').on('click', function (event) {
      event.preventDefault();
      var id = event.target.id;
      App.Map.currentId = id;

      var obj = self.fetch( App.Map.currentNeighborhood );
      var data = self.getDatatable( obj );


      self.choropleth(svg, path, id);

      templatize('#legend-tmpl', '.legend', self.legendCopy( id ));
      templatize('#map-alt-tmpl', '.map-alt-placeholder',  self.legendCopy( id ));
      templatize('#tooltip-tmpl', '.map-alt-datatable-placeholder', data);

      // hack
      // setting select view
      $('#map-alt select').val(App.Map.currentNeighborhood);

      self.createlegend( id );

      adjustChoroplethEvent(); // Reattaches events to new template
      $('.sfc-data-button').removeClass('active');
      $('.sfc-data-button#'+id).addClass('active');
    });

    $('#map-alt select').on('change', function (event) {
      App.Map.currentNeighborhood = this.value;

      var obj = self.fetch( App.Map.currentNeighborhood );
      var data = self.getDatatable( obj );

      templatize('#tooltip-tmpl', '.map-alt-datatable-placeholder', data);
      adjustChoroplethEvent(); // Reattaches events to new template
    });
  };

  function attribution (svg) {
    d3.selectAll('.svg-container')
      .append('div')
      .attr('class', 'attribution');

    templatize('#attribution-tmpl', '.attribution', {});
  };

  function renderLegend (svg) {
    d3.selectAll('.svg-container')
      .append('div').attr('class', 'row')
        .append('div')
          .attr('class', 'legend large-4 columns');

    templatize('#legend-tmpl', '.legend',  self.legendCopy( App.Map.currentId ));
    templatize('#map-alt-tmpl', '.map-alt-placeholder',  self.legendCopy( App.Map.currentId ));

    adjustChoroplethEvent();
    $('.sfc-data-button#'+App.Map.currentId).addClass('active');
  }

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

  function renderTopojson (svg) {
    /* Render topojson of SF Airbnb neighborhoods
       Converted from KML for John Blanchard */
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

  function renderCredits (svg) {
    /* Credits for map */
    d3.selectAll('.svg-container').append('span')
      .attr('id', 'map-credits')
      .text('Credits: Aaron Williams, John Blanchard and Maegan Clawges | Source: Connotate');
  }
};

App.Map.fetch = function (neighborhood) {
  /* given a neighborhood name, return JSON object */
  var obj = App.jsonCache.objects.neighborhoods.geometries.filter(function (n) {
    return n.properties.name === neighborhood;
  })[0];

  return obj;
};

App.Map.getDatatable = function (d) {
  /* Format data for tooltip and mobile table */
  var total;
  var self = this;
  if (!App.Map.currentId) { return d.properties.name; }

  if (App.Map.currentId === 'avgOfPrice') {
    total = {
      2014: numberWithCommas(d.properties.totalAvgPrice['2014']),
      2015: numberWithCommas(d.properties.totalAvgPrice['2015'])
    };
  } else {
    total = {
      2014: numberWithCommas(self.addAllProperties(d, App.Map.currentId, 2014).total),
      2015: numberWithCommas(self.addAllProperties(d, App.Map.currentId, 2015).total)
    };
  }

  var data = {
    id: App.Map.currentId,
    name: d.properties.name,
    total: total,
    totalLabel: App.Map.currentId === 'avgOfPrice' ? 'Average, all property types' : 'Total',
    home: {
      2014: numberWithCommas(d.properties.entireHome[App.Map.currentId]['2014']),
      2015: numberWithCommas(d.properties.entireHome[App.Map.currentId]['2015'])
    },
    privateRoom: {
      2014: numberWithCommas(d.properties.privateRoom[App.Map.currentId]['2014']),
      2015: numberWithCommas(d.properties.privateRoom[App.Map.currentId]['2015'])
    },
    sharedRoom: {
      2014: numberWithCommas(d.properties.sharedRoom[App.Map.currentId]['2014']),
      2015: numberWithCommas(d.properties.sharedRoom[App.Map.currentId]['2015'])
    }
  }

  return data;
};

App.Map.choropleth = function (svg, path, id) {
  /* Creat choropleth map based on data Id */
  var self = this;

  var scale     = self.generateScales( id );
  var scaletype = id === 'avgOfPrice' ? 'quantize' : 'quantile';

  d3.selectAll('.neighborhood')
    .attr('class', function (d) { return scale( self.addAllProperties( d, id, 2015 ).total ) + ' neighborhood'; })
    .attr('d', path);

  self.createlegend( App.Map.currentId ); // intialize legend
};

App.Map.createlegend = function (id) {
  $('#map-legend').html('');
  var self = this;

  var legend = d3.select('#map-legend').append('ul')
      .attr('class', 'inline-list');

  var colors = self.generateScales(id, true);

  // var colors = d3.scale.quantize()
  //   .range(range);

  var keys = legend.selectAll('li.key')
    .data(colors.range());

  keys.enter().append('li')
    .attr('class', 'key')
    .attr('id', id)
    .style('border-bottom-color', String)
    .text(function (d) {
      var r       = colors.invertExtent(d),
          lowEnd  = Math.floor(r[0]), //Math.floor(r[0] * 100),
          highEnd = Math.floor(r[1]); //Math.floor(r[1] * 100);

      return numberWithCommas(lowEnd)+' - '+numberWithCommas(highEnd);
    });
};

App.Map.generateScales = function (id, forLegend) {
  var forLegend = forLegend || false;
  /* Given an ID, generate a scale */
  var scale;
  var self = this;
  var scaleLength = 8;

  var legendRange = ['rgb(255,255,204)', 'rgb(255,237,160)', 'rgb(254,217,118)', 'rgb(254,178,76)', 'rgb(253,141,60)', 'rgb(252,78,42)', 'rgb(227,26,28)', 'rgb(177,0,38)'],
      mapRange = d3.range(scaleLength).map(function (i) { return 'q'+i+'-'+scaleLength }),
      range = forLegend ? legendRange : mapRange;

  var neighborhoods = App.jsonCache.objects.neighborhoods.geometries;

  var domain = _.chain(neighborhoods)
      .map(function (neighborhood) { return self.addAllProperties( neighborhood, id, 2015 ).total; })
      .sortBy(function (value) { return value; })
      .value();

  var map = {
    'avgOfPrice': function () {
      var _topHood    = _.max(neighborhoods, function (n) { return self.addAllProperties(n, id, 2015 ).total; }),
          _bottomHood = _.min(neighborhoods, function (n) { return self.addAllProperties(n, id, 2015 ).total; });

      var min = self.addAllProperties(_bottomHood, id, 2015).total,
          max = self.addAllProperties(_topHood, id, 2015).total;

      scale = d3.scale.quantize()
        .domain([min, max])
        .range(range);
    },
    'locationsCount': function () {
      scale = d3.scale.quantile()
        .domain(domain)
        .range(range);
    },
    'reviewCount': function () {
      scale = d3.scale.quantile()
        .domain(domain)
        .range(range);
    }
  };

  var thisScale = map[id];
  if (thisScale) { thisScale(); return scale; }
}

App.Map.addAllProperties = function (d, id, year) {
  /* Sum the values of an id type */
  var total      = 0.0;
  var properties = ['entireHome', 'privateRoom', 'sharedRoom'];

  properties.forEach(function (property) {
    total += d.properties[property][id][year]
  });

  if (id === 'avgOfPrice') { total = d.properties.totalAvgPrice[year]; }

  return {'neighborhood': d.properties.name, 'property': id, 'total': total};
};

App.Map.legendCopy = function (id) {
  var map = {
    'avgOfPrice': function () {
      var copy = {};
      copy.hed = 'Average price'
      copy.dek = "Airbnb prices correlate with the city’s regular real estate. the priciest vacation rentals on average were in Pacific Heights ($288 for all types of properties; $360 for entire homes); and Fisherman’s Wharf ($287/$295), while the most-affordable were in Crocker Amazon ($92 for all types; $144 for entire homes) and Lakeshore ($108/$142).";
      copy.id = 'avgOfPrice';
      return copy;
    },
    'locationsCount': function () {
      var copy = {};
      copy.hed = 'Total locations';
      copy.dek = 'The Mission District remained the neighborhood with the most Airbnb listings, though the average price of units didn’t rank among the city’s highest (Pacific Heights is the costliest at $288 for all types of properties). The percent change in the number of reviews within neighborhoods provides a clue about how frequently Airbnb units there are rented to visitors.';
      copy.id = 'locationsCount';
      return copy;
    },
    'reviewCount': function () {
      var copy = {};
      copy.hed = 'Total reviews';
      copy.dek = 'While the number of reviews correlates to the number of listings in a neighborhood, it’s noteworthy that Mission listings have 16,282 reviews, 6,321 of them amassed in the past year, implying a heavy guest presence in that neighborhood. Not all guests write reviews, so the numbers underestimate usage.';
      copy.id = 'reviewCount';
      return copy;
    }
  };

  var thisScale = map[id];
  if (thisScale) { return thisScale(); }
}