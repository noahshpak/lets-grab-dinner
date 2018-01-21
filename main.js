$(document).ready(function() {

    // Initialize the client
  var client = algoliasearch("MOO6B8R0Z1", "a9b849cc21a51347b3082a5e30e70f4b");

  const indexName = 'open-table-restaurants';
  var index = client.initIndex(indexName);
  const facetLabels = ['food_type', 'normalized_star_count', 'payment_options'];
  const facetDisplayNames = {
    'food_type': 'Cuisines',
    'normalized_star_count': 'Rating',
    'payment_options': 'Payment Options'
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  var $hitsContainer = $('#container');
  var $searchBox = $("#search-box");
  var $hits = $('#hits');
  var $facetList = $("#facet-list");
  var $fetchedOutputDescriptor = $('#fetched-output-descriptor');
  var $geoSwitch = $('#geo-switch');
  var $progressBar = $('#progress-bar').hide();
  var $cuisineSearch = $('#cuisine-search');
  var $searchableFacetList = $('#searchable-facet-list');
  var helper = algoliasearchHelper(client, indexName, { facets: facetLabels });

  // Trigger a first search, so that we have a page with results
  // from the start.
  helper.search();


  /* EVENTS */

  // Listen to results coming from Algolia
  helper.on('result', function(content) {
    renderFacetList($facetList, content);
    renderSearchableFacetList($searchableFacetList, '', 'Cuisines', 'food_type')
    renderFetchedOutputDescriptor($fetchedOutputDescriptor, content);
    renderHits($hitsContainer, content);

  });

  // Listen to clicks on facets
  $facetList.on('click', 'button', function(e) {
    var facetValue = $(this).data('facet');
    let facetLabel = $(this).data('label');
    helper.toggleRefinement(facetLabel, facetValue).search();

  });

  // Listen to clicks on facets
  $searchableFacetList.on('click', 'button', function(e) {
    var facetValue = $(this).data('facet');
    let facetLabel = $(this).data('label');
    helper.toggleRefinement(facetLabel, facetValue).search();
    // TODO toggle refinement of the list

  });

  // Fetch new results when char added to query
  $searchBox.on('keyup', function() {
      helper.setQuery($(this).val()).search();
  });

  $cuisineSearch.on('keyup', function() {
    renderSearchableFacetList($searchableFacetList, $(this).val(), 'Cuisines', 'food_type')


  });


  // Listen to toggles of geoSwitch
  $geoSwitch.change(function() {
      if (this.checked) {
         limitByGeo();
      }
      else {
        helper.setQueryParameter('aroundLatLng', "");
        helper.setQueryParameter('aroundRadius', "");
        helper.search();
        $progressBar.hide();
      }
  });
  /* END EVENTS*/

  /* HELPERS */
  // Used in SelectionSort
  function swap(items, firstIndex, secondIndex){
    var temp = items[firstIndex];
    items[firstIndex] = items[secondIndex];
    items[secondIndex] = temp;
  }
  // Used to stably sort the Ratings Labels so that they
  // are in Ascending order in the Facet List
  function selectionSort(items, label){
    var len = items.length, min;
    for (i = 0; i < len; i++){
      //set minimum to this position
      min = i;
      //check the rest of the array to see if anything is smaller
      for (j = i + 1; j < len; j++) {
        if (items[j].label == label && label == items[min].label) {
          if (items[j].name < items[min].name) min = j;
        }
      }
      //if the minimum isn't in the position, swap it
      if (i != min) swap(items, i, min);
    }
    return items;
  }
  // Shorten Names and Abbreviate Long / redundant words
  function cleanFacet(facet) {
    var name = facet.name;
    if (name.includes('Cuisine')) {
      name = name.replace('Cuisine', '');
    }
    if (name.includes('Contemporary')) {
      name = name.replace('Contemporary', 'Cont.')
    }
    if (name.length > 20) {
      name = name.slice(0,18) + '...';
    }

    return name

  }

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

  // helper function to add Full, Border, and Half Stars to ratings
  function appendStars(container, normalized_star_count, stars_count, include_halfs) {
    // append empty and non-empty stars
    var starsAdded = 0
    for (var i = 0; i < normalized_star_count; i++) {
        let star = $('<i></i>').attr('class', 'star lightsalmon material-icons').html('star');
        container.append(star.clone());
        starsAdded++;
    }

    if (include_halfs) {
      for (var k = 0; k < stars_count - normalized_star_count; k++) {
          let partialStar = $('<i></i>').attr('class', 'star lightsalmon material-icons').html('star_half');
          container.append(partialStar.clone());
          starsAdded++;
      }
      //
      for (var j = 0; j < 5 - starsAdded; j++) {
          let emptyStar = $('<i></i>').attr('class', 'star lightsalmon material-icons').html('star_border');
          container.append(emptyStar.clone());
      }
    } else {
      //
      for (var j = 0; j < 5 - starsAdded; j++) {
          let emptyStar = $('<i></i>').attr('class', 'star lightsalmon material-icons').html('star_border');
          container.append(emptyStar.clone());
      }
    }
  }


  function renderSearchableFacetList(searchbox, query, title, label) {
    index.searchForFacetValues({
      facetName: label,
      facetQuery: query
    }, function(err, content) {
      if (err) {
        console.error(err);
        return;
      }

      let facetValues = content.facetHits;
      for (let f of facetValues) {
        f.label = label;
        f.name = f.value;
      }
      let checkboxes = $.map(facetValues, renderFacet);
      let header = $('<h5></h5>').html(title);
      if (checkboxes.length > 0) {
        $searchableFacetList.html(checkboxes);
      } else {
        let noResults = $('<p></p>').html('Sorry, no cuisines were found given those criteria.');
        $searchableFacetList.html(noResults)
      }

      $searchableFacetList.prepend(header);

    })
  }
  /* END HELPERS */

  /* VIEWS */
  // Creates the UI for each hit (returned by the Algolia Helper)
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

    let starsCount = $('<span></span>').attr('class', 'orange-text').html(hit.stars_count + " ");
    let hitReviews = $('<div></div>').append(starsCount);

    appendStars(hitReviews, hit.normalized_star_count, hit.stars_count);


    let reviewsCount = $('<span></span>').html(' (' + hit.reviews_count + ') reviews');
    hitReviews.append(reviewsCount);

    let collectionItem = $('<li></li>').attr('class', 'collection-item avatar');
    collectionItem.append(imgHTML).append(hitTitle).append(hitReviews).append(details);

    return collectionItem
  }
  // Render 'N Results found in 0.xxx seconds'
  function renderFetchedOutputDescriptor(container, content) {
      let processingTimeSeconds = content.processingTimeMS / 1000;
      let numResults = content.nbHits;
      let found = $('<b></b>').html(numResults + ' results found');
      let descriptor = $('<span></span>').html(found).append(' in ' + processingTimeSeconds + ' seconds').append('<hr>')
      if (numResults > 0) {
        container.html(descriptor);
      } else {
        let noResults = $('<p></p>').html('Sorry, no Restaurants were found given those criteria.');
        let clearButton = $('<a></a>').attr('class', 'btn red lighten-2').html('Clear').on('click', function() {
          helper.setQueryParameter('aroundLatLng', "");
          helper.setQueryParameter('aroundRadius', "");
          toggledFacets = {};
          $searchBox.val('');
          helper.setQuery('').search();
          $geoSwitch.prop('checked', false)
        })
        container.html(descriptor).append(noResults).append(clearButton);
      }

  }

  // Add the hits to the container
  function renderHits(container, content) {
      container.html(function() {
        return $.map(content.hits, function(hit) {
            return constructHtml(hit)
        });
      });
  }

  // create UI for Facet
  function renderFacet(facet) {
    var button = $('<button>').data('facet', facet.name)
                                             .data('label', facet.label)
                                             .attr('id', 'fl-' + facet.name);
    if (facet.isRefined) {
      if (facet.label == 'normalized_star_count') {
          button.attr('class', 'chip lighten-4')
      } else {
          button.attr('class', 'chip lighten-4')
      }
    } else {
        if (facet.label == 'normalized_star_count') {
            button.attr('class', 'chip white')
        } else {
            button.attr('class', 'chip white lighten-2');
        }
    }

    if (facet.label == 'normalized_star_count') {
        appendStars(button, facet.name, 5, false)
    } else {
        let displayName = cleanFacet(facet)
        button.html(displayName + ' (' + facet.count + ')').attr('for', 'fl-' + facet.name);
    }
    return $('<div>').append(button);
  }

  function renderFacetList(facetList, content) {
      facetList.html(function() {
        let list = [];
        for (let facetLabel of facetLabels) {
          if (facetLabel !== 'food_type') {
            let header = $('<h5></h5>').html(facetDisplayNames[facetLabel]);
            let facetValues = content.getFacetValues(facetLabel);
            // add labels so that we can process them
            for (let facetValue of facetValues) {
              facetValue.label = facetLabel;
            }

            facetValues = selectionSort(facetValues, 'normalized_star_count');

            var checkboxes = $.map(facetValues, renderFacet);
            if (checkboxes.length > 0) {
              list.push(header);
            }
            list.push.apply(list, checkboxes);
          } else {
            // renderSearchableFacetList($cuisineSearch, '', 'Cuisine', 'food_type');
            let facetValues = content.getFacetValues('food_type');
            for (let f of facetValues) {
              f.label = 'food_type';
            }
            let checkboxes = $.map(facetValues, renderFacet);
            let header = $('<h5></h5>').html('Cuisines');
            if (checkboxes.length > 0) {
              $searchableFacetList.html(checkboxes);
            } else {
              let noResults = $('<p></p>').html('Sorry, no cuisines were found given those criteria.');
              $searchableFacetList.html(noResults)
            }

            $searchableFacetList.prepend(header);
          }
        }
        return list;
      });
  }

  /* END VIEWS */


});
