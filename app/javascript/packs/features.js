export default function() {
  $('.add-feature-button').click(function() {
    $('#new-feature-modal').modal('open');
  });

  $('#new-feature-modal').modal();
  $('#add-feature-submit-button').click(function() {
    var name              = $('#name').val();
    var number            = $('#number').val();
    var description       = $('#description').val();
    var externalLink      = $('#external_link').val();
    var externalThumbnail = $('#external_thumbnail').val();
    var category          = $('#category').val();
    $.post('/admin/features', {
      name:               name,
      number:             number,
      description:        description,
      external_link:      externalLink,
      external_thumbnail: externalThumbnail,
      category:           category
    }).done(function() {
      window.location.reload();
    }).fail(function(e) {
      alert(e.responseJSON.reason);
    });
  });

  var featureId = null;
  $('.remove-feature-button').click(function(e) {
    featureId = $(e.target).attr('data-id');
    $('#remove-feature-modal').modal('open');
  });
  $('#remove-feature-modal').modal();
  $('#remove-feature-submit-button').click(function() {
    if (featureId) {
      $.post(`/admin/features/${featureId}`, {
        _method: 'DELETE',
      }).done(function() {
        window.location.reload();
      }).fail(function(e) {
        alert(e);
      });
    }
  });
}