export function trackArtistAutocomplete() {
  const items = {};
  $('#track_artist_query').on('input', $.debounce(250, function(e) {
    const $input = $(e.target);
    $.get('/search_artists.json', { query: $input.val() }).done(function(result) {
      var data = {};
      result.forEach(function(artist) {
        var id    = artist.name.trim();
        items[id] = artist;
        data[id]  = null;
      });
      $input.autocomplete({
        data:           data,
        limit:          Infinity,
        minLength:      1,
        onAutocomplete: function(val) {
          const item = items[val];
          $input.val($input.val());
          $('#track_artist_id').val(item.id);
        },
      });
      $input.trigger('focus');
    }).fail(function(e) {
      console.log(e);
    });
  }));
}

export function trackAlbumAutocomplete() {
  const items = {};
  $('#track_album_query').on('input', $.debounce(250, function(e) {
    const $input = $(e.target);
    $.get('/search_albums.json', { query: $input.val() }).done(function(result) {
      var data = {};
      result.forEach(function(album) {
        var id         = album.name + '|' + album.artist.name;
        id             = id.trim();
        items[id] = album;
        data[id]  = null;
      });
      $input.autocomplete({
        data:           data,
        limit:          Infinity,
        minLength:      1,
        onAutocomplete: function(val) {
          const item = items[val];
          $input.val($input.val());
          $('#track_album_id').val(item.id);
        },
      });
      $input.trigger('focus');
    }).fail(function(e) {
      console.log(e);
    });
  }));
}

export function albumArtistAutocomplete() {
  const items = {};
  $('#album_artist_query').on('input', $.debounce(250, function(e) {
    const $input = $(e.target);
    $.get('/search_artists.json', { query: $input.val() }).done(function(result) {
      var data = {};
      result.forEach(function(artist) {
        var id    = artist.name.trim();
        items[id] = artist;
        data[id]  = null;
      });
      $input.autocomplete({
        data:           data,
        limit:          Infinity,
        minLength:      1,
        onAutocomplete: function(val) {
          const item = items[val];
          $input.val($input.val());
          $('#album_artist_id').val(item.id);
        },
      });
      $input.trigger('focus');
    }).fail(function(e) {
      console.log(e);
    });
  }));
}
