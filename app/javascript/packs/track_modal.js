export default function() {
  $('#track-modal').modal();
  $('.track-item').click(function(e) {
    if (e.target.tagName === 'A') { return; }
    var $parent = $(e.target).closest('.track-item');
    var title = $parent.find('.track-name').text();
    var artist = $parent.find('.artist-name > a').text();
    var album = $parent.find('.album-name > a').text();
    $('#track-title').text(title);
    $('#track-album').text(album);
    $('#track-artist').text(artist);
    $('#track-modal').modal('open');
  });
}