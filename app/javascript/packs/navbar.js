export default function() {
  const $navNormal   = $('#nav-normal');
  const $navSearch   = $('#nav-search');
  const $search      = $('#search');
  const $searchForm  = $('#search-form');
  const $searchField = $('#search-field');
  const $searchIcon  = $('#search-icon');
  const $searchClose = $('#search-close');
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

}
