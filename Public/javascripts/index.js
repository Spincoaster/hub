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
    top.onload = function() {
      var previousLocation = localStorage.getItem("last_location");
      if (previousLocation !== null && previousLocation !== window.location.href) {
        top.location.href = previousLocation + '?restore_mode';
      }
      localStorage.removeItem("last_location");
    };
    var links = document.links;
    var link;
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.href.toLowerCase().indexOf('javascript') === -1) {
        link.addEventListener('click', function(e) {
          if (this.target !== '_blank') {
            top.location.href = this.href;
            e.returnValue = false;
          } else {
            localStorage.setItem("last_location", window.location.href);
            window.open(this.href);
          }
        }, false);
      }
    }
    if (document.referrer !== '' && top.location.href.indexOf('restore_mode') === -1) {
      $('.back').show();
    }
  }
  $('.artist-item').click(function(e) {
    window.location = $(e.target).parent().find('a').attr('href');
  });
  $('.album-item').click(function(e) {
    window.location = $(e.target).parent().find('a').attr('href');
  });
  $('#record-modal').modal();
  $('.record-item').click(function(e) {
    if (e.target.tagName === 'A') { return }
    var $parent = $(e.target).closest('.record-item');
    var title = $parent.find('.record-name').text();
    var artist = $parent.find('.artist-name > a').text();
    var owner = $parent.find('.owner-name > a').text();
    var location = $parent.find('.location-name').text();
    $('#record-title').text(title);
    $('#record-artist').text(artist);
    $('#record-location').text(location);
    $('#record-owner').text(owner);
    $('#record-modal').modal('open');
  });
  $('#track-modal').modal();
  $('.track-item').click(function(e) {
    if (e.target.tagName === 'A') { return }
    var $parent = $(e.target).closest('.track-item');
    var title = $parent.find('.track-name').text();
    var artist = $parent.find('.artist-name > a').text();
    var album = $parent.find('.album-name > a').text();
    $('#track-title').text(title);
    $('#track-album').text(album);
    $('#track-artist').text(artist);
    $('#track-modal').modal('open');
  });
  $('tr.owner-item').click(function(e) {
    if (e.target.tagName === 'A') { return }
    var $parent = $(e.target).parent();
    var $a = $parent.find('a');
    window.location = $a.attr('href');
  });
});
