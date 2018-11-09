export function scrollToActive() {
  const w = 50;
  $('li.active').each(function(i) {
    var $parent = $(this).parent();
    $parent.scrollLeft($(this).offset().left - 1.5 * w - $parent.width() / 2);
  });

}
