$(document).ready(function() {
  // Initialize the client
  var client = algoliasearch("MOO6B8R0Z1", "a9b849cc21a51347b3082a5e30e70f4b");
  var index = client.initIndex('open-table-restaurants');


    // firstname
  index.search('burger', function(err, content) {
    console.log(content.hits);
  });

  // firstname with typo
  index.search('steak', function(err, content) {
    console.log(content.hits);
  });

  // a company
  index.search('fine dining', function(err, content) {
    console.log(content.hits);
  });

  // a firstname & company
  index.search('4.5', function(err, content) {
    console.log(content.hits);
  });
});
