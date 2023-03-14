export default function() {
  $('#record-modal').modal();
  $('.record-item').click(function(e) {
    if (e.target.tagName === 'A' || e.target.tagName === 'I') { return; }
    var $parent = $(e.target).closest('.record-item');
    var title = $parent.find('.record-name').text();
    var artist = $parent.find('.artist-name').text();
    var owner = $parent.find('.owner-name').text();
    var location = $parent.find('.location-name').text();
    $('#record-title').text(title);
    $('#record-artist').text(artist);
    $('#record-location').text(location);
    $('#record-owner').text(owner);
    $('#record-modal').modal('open');

    gtag('event', 'record_modal', {
      title,
      artist,
      owner
    });
  });
}
