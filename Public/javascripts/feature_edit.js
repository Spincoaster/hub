$(function() {
  $('.add-featured-item-button').click(function() {
    $('#new-featured-item-modal').modal('open');
  });
  var delay = 250;
  var featureId = $('#feature-id').val();
  var item = null;
  var $itemInput = $('#item-input');
  var items = {};
  $itemInput.on('input', $.debounce(250, function() {
    console.log('-------- input');
    $.get('/admin/search', { query: $itemInput.val() }).done(function(result) {
      var data = {};
      result.tracks.forEach(function(track) {
        var id         = track.name + '|' + track.album.name + '|' + track.artist.name;
        items[id]      = track;
        items[id].type = 'track';
        data[id]       = null;
      });
      result.records.forEach(function(record) {
        var id         = record.name + '|' + record.artist.name;
        items[id]      = record;
        items[id].type = 'record';
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
    var itemNumber = $('#item-number').val();
    console.log(itemNumber);
    $.post('/admin/featured_items', {
      feature_id: featureId,
      item_id:    item.id,
      item_type:  item.type,
      number:     itemNumber,
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
    $.post(`/admin/featured_items/${itemId}`, { _method: 'DELETE' }).done(function() {
      window.location.reload();
    }).fail(function(e) {
      alert(e.responseJSON.reason);
    });
  });
});
