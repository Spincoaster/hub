export default function() {
  $('.add-featured-item-button').click(function() {
    $('#new-featured-item-modal').modal('open');
  });
  var delay = 250;
  var featureId = $('#feature-id').val();
  var item = null;
  var $itemInput = $('#item-input');
  var items = {};
  $itemInput.on('input', $.debounce(250, function() {
    $.get('/search.json', { query: $itemInput.val() }).done(function(result) {
      var data = {};
      result.tracks.forEach(function(track) {
        var id         = track.name + '|' + track.album.name + '|' + track.artist.name;
        id             = id.trim();
        items[id]      = track;
        items[id].type = 'Track';
        data[id]       = null;
      });
      result.records.forEach(function(record) {
        var id         = record.name + '|' + record.artist.name;
        id             = id.trim();
        items[id]      = record;
        items[id].type = 'Record';
        data[id]       = null;
      });
      $itemInput.autocomplete({
        data:           data,
        limit:          Infinity,
        minLength:      1,
        onAutocomplete: function(val) {
          item = items[val];
          $itemInput.val($itemInput.val());
        },
      });
      $itemInput.trigger('focus');
    }).fail(function(e) {
      console.log(e);
    });
  }));
  $('#add-featured-item-submit-button').click(function() {
    if (!item) {
      alert('item is not specified');
      return;
    }
    const itemNumber = $('#item-number').val();
    const itemComment = $('#item-comment').val();
    const csrfToken = $('#csrf_token').val();
    $.ajax({
      url: '/feature_items',
      type: 'POST',
      data: {
        feature_item: {
          feature_id: featureId,
          item_id:    item.id,
          item_type:  item.type,
          number:     itemNumber,
          comment:    itemComment,
        }
      },
      dataType: 'json',
      headers: {
        'X-CSRF-Token': csrfToken,
      }
    }).done(function() {
      window.location.reload();
    }).fail(function(e) {
      alert(e.responseJSON.reason);
    });
  });

  $('#new-featured-item-modal').modal();

  var itemId = null;
  $('.remove-featured-item-button').click(function(e) {
    itemId = $(e.target).attr('data-id');
    $('#remove-featured-item-modal').modal('open');
  });
  $('#remove-featured-item-modal').modal();

  $('#remove-featured-item-submit-button').click(function() {
    const csrfToken = $('#csrf_token').val();
    $.ajax({
      url: `/feature_items/${itemId}`,
      type: 'POST',
      data: { _method: 'DELETE' },
      dataType: 'json',
      headers: {
        'X-CSRF-Token': csrfToken,
      }
    }).done(function() {
      window.location.reload();
    }).fail(function(e) {
      alert(e.responseJSON.reason);
    });
  });
}
