$(document).ready(function() {
  // Initialize the client
  var client = algoliasearch("MOO6B8R0Z1", "a9b849cc21a51347b3082a5e30e70f4b");
  const indexName = 'open-table-restaurants';

  var helper = algoliasearchHelper(client, indexName);

  // Listen to results coming from Algolia
  helper.on('result', function(content) {
    renderHits(content);
  });

  function renderHits(content) {
    $('#container').html(function() {
      return $.map(content.hits, function(hit) {
        return '<li>' + hit.name + '</li>';
      });
    });
  }

  helper.search();

  var $searchBox = $("#search-box");
  var $hits = $('#hits');

  // Fetch new results when char added to query
  $searchBox.on('keyup', function() {
      helper.setQuery($(this).val()).search();
  });

  // Trigger a first search, so that we have a page with results
  // from the start.
  helper.search();


});
