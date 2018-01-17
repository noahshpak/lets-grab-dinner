$(document).ready(function() {
    // Initialize the client
  var client = algoliasearch("MOO6B8R0Z1", "a9b849cc21a51347b3082a5e30e70f4b");
  const indexName = 'open-table-restaurants';

  var helper = algoliasearchHelper(client, indexName, {
    facets: ['food_type', 'stars_count', 'payment_options']
  });


  // Listen to results coming from Algolia
  helper.on('result', function(content) {
    renderFacetList(content);
    renderHits(content);
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

  function renderHits(content) {
    $('#container').html(function() {
      return $.map(content.hits, function(hit) {
        console.log(hit);
        let imgHTML = '<img src=' + hit.image_url + '></img>';
        let hitTitle = "<div class='hit-title'>" + hit.name + "</div>";
        let hitReviews = "<span class='reviews'>Reviews (" + hit.reviews_count + ')</span>';
        let hitRating = "<div class='hit-rating'>Rating: " + hit.stars_count + hitReviews + '</div>';

        const spacer = '&nbsp' + ' | ' + '&nbsp';
        let details = hit.food_type + spacer + hit.neighborhood + spacer + hit.price_range;
        let restaurantDetails = "<div class='details'>" + details + "</div>";
        let hitDescription = "<div class='description'>" + hitTitle + hitRating + restaurantDetails + "</div>";
        return '<div class="hit-item">' + imgHTML + hitDescription + '</div>';
      });
    });
  }

  var $searchBox = $("#search-box");
  var $hits = $('#hits');
  var $facetList = $("#facet-list");

  $facetList.on('click', 'input[type=checkbox]', function(e) {
    var facetValue = $(this).data('facet');
    helper.toggleRefinement('type', facetValue).search();
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

  function renderFacetList(content) {
    $facetList.html(function() {
      return $.map(content.getFacetValues('type'), processFacet);
    });
  }


  // Fetch new results when char added to query
  $searchBox.on('keyup', function() {
      helper.setQuery($(this).val()).search();
  });

  // Trigger a first search, so that we have a page with results
  // from the start.
  helper.setQueryParameter('hitsPerPage', 7).search();


});
