$(function() {
  var $navNormal   = $('#nav-normal');
  var $navSearch   = $('#nav-search');
  var $search      = $('#search');
  var $searchForm  = $('#search-form');
  var $searchField = $('#search-field');
  var $searchIcon  = $('#search-icon');
  var $searchClose = $('#search-close');
  $search.on('click', function() {
    $navSearch.fadeIn();
    $navNormal.fadeOut();
    $searchField.focus();
  });
  $searchField.on('blur', function() {
    $navSearch.fadeOut();
    $navNormal.fadeIn();
  });
  $searchIcon.on('click', function() {
    $searchForm.submit();
  });
  $searchClose.on('click', function() {
    $searchField.blur();
  });

  var w = 50;
  $('li.active').each(function(i) {
    var $parent = $(this).parent();
    $parent.scrollLeft($(this).offset().left - 1.5 * w - $parent.width() / 2);
  });

  if (('standalone' in window.navigator) && window.navigator.standalone) {
    var links = document.links;
    var link;
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.href.toLowerCase().indexOf('javascript') === -1) {
        link.addEventListener('click', function(e) {
          top.location.href = this.href;
          e.returnValue = false;
        }, false);
      }
    }
  }
});
