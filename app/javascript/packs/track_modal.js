export default function() {
  $('#track-modal').modal();
  $('.track-item').click(function(e) {
    if (e.target.tagName === 'A' || e.target.tagName === 'I') { return; }
    var $parent = $(e.target).closest('.track-item');
    var title = $parent.find('.track-name').text();
    var artist = $parent.find('.artist-name').text();
    var album = $parent.find('.album-name').text();
    $('#track-title').text(title);
    $('#track-album').text(album);
    $('#track-artist').text(artist);
    $('#track-modal').modal('open');

    gtag('event', 'select_content', {
      content_type: 'track',
      content_id: title,
      item_id: title
    });
  });
}
