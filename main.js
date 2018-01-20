$(document).ready(function() {

    // Initialize the client
  var client = algoliasearch("MOO6B8R0Z1", "a9b849cc21a51347b3082a5e30e70f4b");
  const indexName = 'open-table-restaurants';

  var helper = algoliasearchHelper(client, indexName, {
    facets: ['food_type']
  });

  var $hitsContainer = $('#container');
  var $searchBox = $("#search-box");
  var $hits = $('#hits');
  var $facetList = $("#facet-list");


  // Listen to results coming from Algolia
  helper.on('result', function(content) {
    renderFacetList($facetList, content);
    renderHits($hitsContainer, content);
  });

  // request geo data -> filter results by current location
  navigator.geolocation.getCurrentPosition(function(pos) {
      let lat = pos.coords.latitude;
      let lng = pos.coords.longitude;
      let query = lat + ', ' + lng;
      let aroundRadius = 80000; // in meters
      helper.setQueryParameter('aroundLatLng', query);
      helper.setQueryParameter('aroundRadius', aroundRadius);
      helper.search();
  });

  function constructHtml(hit) {
    let imgHTML = $('<img></img>').attr('src', hit.image_url)
                                  .attr('class', 'responsive-img circle z-depth-1');
    let hitTitle = $('<span></span>').html(hit.name).attr('class', 'title');

    const spacer = '&nbsp' + ' | ' + '&nbsp';
    let details = $('<p></p>')
                        .html(hit.food_type + spacer + hit.neighborhood + spacer + hit.price_range)
                        .attr('class', '');

    let hitReviews = $('<p></p>').html('Stars: ' + hit.stars_count + '   Reviews: ' + hit.reviews_count);
    let collectionItem = $('<li></li>').attr('class', 'collection-item avatar');
    collectionItem.append(imgHTML).append(hitTitle).append(hitReviews).append(details);

    return collectionItem
  }

  function renderHits(container, content) {
    container.html(function() {
      return $.map(content.hits, function(hit) {
        return constructHtml(hit)
      });
    });
  }



  $facetList.on('click', 'input[type=checkbox]', function(e) {
    var facetValue = $(this).data('facet');
    helper.toggleRefinement('food_type', facetValue).search();
  });

  function processFacet(facet) {
    var checkbox = $('<input type=checkbox>').data('facet', facet.name)
                                            .attr('id', 'fl-' + facet.name);
    if (facet.isRefined) {
      checkbox.attr('checked', 'checked');
    }
    var label = $('<label>').html(facet.name + ' (' + facet.count + ')')
                            .attr('for', 'fl-' + facet.name);
    return $('<li>').append(checkbox).append(label);
  }

  function breakIntoEvenChunks(step, divs) {
    let cols = [];
    for (var i = 0; i < divs.length - step; i += step) {
      let col = $('<div></div>').attr('class', 'col s2');
      let divsForThisCol = divs.slice(i, i + step);
      for (var j = 0; j < divsForThisCol.length; j++) {
        col.append(divsForThisCol[j]);
      }
      cols.push(col)
    }
    return cols;
  }

  function renderFacetList(facetList, content) {
      facetList.html(function() {
        let checkboxes = $.map(content.getFacetValues('food_type'), function(facet) {

          var checkbox = $('<input type=checkbox>')
            .data('facet', facet.name)
            .attr('id', 'fl-' + facet.name);
          if(facet.isRefined) checkbox.attr('checked', 'checked');
          var label = $('<label>').html(facet.name + ' (' + facet.count + ')')
                                  .attr('for', 'fl-' + facet.name);
          return $('<div>').append(checkbox).append(label);
        });

        // return breakIntoEvenChunks(10, checkboxes);

        return checkboxes
      });
  }


  // Fetch new results when char added to query
  $searchBox.on('keyup', function() {
      helper.setQuery($(this).val()).search();
  });

  // Trigger a first search, so that we have a page with results
  // from the start.
  helper.setQueryParameter('hitsPerPage').search();


});
