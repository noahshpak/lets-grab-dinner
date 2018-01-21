$(document).ready(function() {

    // Initialize the client
  var client = algoliasearch("MOO6B8R0Z1", "a9b849cc21a51347b3082a5e30e70f4b");
  const indexName = 'open-table-restaurants';
  const facetLabels = ['food_type', 'normalized_star_count', 'payment_options'];
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const facetDisplayNames = {
    'food_type': 'Cuisines',
    'normalized_star_count': 'Rating',
    'payment_options': 'Payment Options'
  }



  var $hitsContainer = $('#container');
  var $searchBox = $("#search-box");
  var $hits = $('#hits');
  var $facetList = $("#facet-list");
  var $fetchedOutputDescriptor = $('#fetched-output-descriptor');
  var $geoSwitch = $('#geo-switch');
  var $progressBar = $('#progress-bar').hide();
  var helper = algoliasearchHelper(client, indexName, { facets: facetLabels });


  // EVENTS //

  // Listen to results coming from Algolia
  helper.on('result', function(content) {
    renderFacetList($facetList, content);
    renderFetchedOutputDescriptor($fetchedOutputDescriptor, content);
    renderHits($hitsContainer, content);

  });

  $facetList.on('click', 'button', function(e) {
    var facetValue = $(this).data('facet');
    let facetLabel = $(this).data('label');
    helper.toggleRefinement(facetLabel, facetValue).search();
  });


  $geoSwitch.change(function() {
      if (this.checked) {
         limitByGeo();
      }
      else {
        helper.setQueryParameter('aroundLatLng', "");
        helper.setQueryParameter('aroundRadius', "");
        helper.search();
      }
  });
  // request geo data -> filter results by current location
  function limitByGeo() {
    $progressBar.show();
    navigator.geolocation.getCurrentPosition(function(pos) {
        let lat = pos.coords.latitude;
        let lng = pos.coords.longitude;
        let query = lat + ', ' + lng;
        let aroundRadius = 80000; // in meters
        helper.setQueryParameter('aroundLatLng', query);
        helper.setQueryParameter('aroundRadius', aroundRadius);
        helper.search();
        $progressBar.hide();
    });
  }




  function constructHtml(hit) {
    let imgHTML = $('<img></img>').attr('src', hit.image_url)
                                  .attr('class', 'responsive-img circle');

    let link = isMobile ? hit.mobile_reserve_url : hit.reserve_url;
    let hitLink = $('<a></a>').html(hit.name).attr('class', 'black-text lighten-4').attr('href', link);
    let hitTitle = $('<span></span>').attr('class', 'title').append(hitLink);

    const spacer = '&nbsp' + ' | ' + '&nbsp';
    let details = $('<p></p>')
                        .html(hit.food_type + spacer + hit.neighborhood + spacer + hit.price_range)
                        .attr('class', '');
    let star = $('<img></img>').attr('src', 'resources/graphics/stars-plain.png')
                               .attr('class', 'star');
    let emptyStar = $('<img></img>')
                               .attr('src', 'resources/graphics/star-empty.png')
                               .attr('class', 'star');


    let starsCount = $('<span></span>').attr('class', 'orange-text').html(hit.stars_count + " ");
    let hitReviews = $('<div></div>').append(starsCount);

    // append empty and non-empty stars
    for (var i = 0; i < hit.normalized_star_count; i++) {
        hitReviews.append(star.clone());
    }
    for (var j = 0; j < 5 - hit.normalized_star_count; j++) {
        hitReviews.append(emptyStar.clone());
    }

    let reviewsCount = $('<span></span>').html(' (' + hit.reviews_count + ') reviews');
    hitReviews.append(reviewsCount);

    let collectionItem = $('<li></li>').attr('class', 'collection-item avatar');
    collectionItem.append(imgHTML).append(hitTitle).append(hitReviews).append(details);

    return collectionItem
  }

  function renderFetchedOutputDescriptor(container, content) {
      let processingTimeSeconds = content.processingTimeMS / 1000;
      let numResults = content.nbHits;
      let found = $('<b></b>').html(numResults + ' results found');
      let descriptor = $('<span></span>').html(found).append(' in ' + processingTimeSeconds + ' seconds').append('<hr>')
      container.html(descriptor);

  }

  function renderHits(container, content) {
      container.html(function() {
        return $.map(content.hits, function(hit) {
            return constructHtml(hit)
        });
      });
  }

  function processFacet(facet) {
    var button = $('<button>').data('facet', facet.name)
                                             .data('label', facet.label)
                                             .attr('id', 'fl-' + facet.name);
    if (facet.isRefined) {
        button.attr('class', 'chip red lighten-4')
    } else {
        button.attr('class', 'chip white lighten-2');
    }

    button.html(facet.name + ' (' + facet.count + ')')
                            .attr('for', 'fl-' + facet.name);
    return $('<div>').append(button);
  }

  function renderFacetList(facetList, content) {
      facetList.html(function() {
        let list = [];
        for (let facetLabel of facetLabels) {
          let header = $('<h5></h5>').html(facetDisplayNames[facetLabel]);
          let facetValues = content.getFacetValues(facetLabel);
          for (let facetValue of facetValues) {
            // add labels so that we can process them
            facetValue.label = facetLabel;
          }
          let checkboxes = $.map(facetValues, processFacet);
          if (checkboxes.length > 0) {
            list.push(header);
          }
          list.push.apply(list, checkboxes);
        }
        return list;
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
