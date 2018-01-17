$(document).ready(function() {
  // Initialize the client
  var client = algoliasearch("MOO6B8R0Z1", "a9b849cc21a51347b3082a5e30e70f4b");
  const indexName = 'open-table-restaurants';

  var helper = algoliasearchHelper(client, indexName);

  // Listen to results coming from Algolia
  helper.on('result', function(content) {
    console.log(content);
    renderHits(content);
  });

  function renderHits(content) {
    $('#container').html(JSON.stringify(content, null, 2));
  }

  helper.search();

  // The different parts of the UI that we want to use in this example
  var $inputfield = $("#search-box");
  var $hits = $('#hits');

  // When there is a new character input:
  // - update the query
  // - trigger the search
  $inputfield.keyup(function(e) {
    helper.setQuery($inputfield.val()).search();
  });

  // Trigger a first search, so that we have a page with results
  // from the start.
  helper.search();

  
});
