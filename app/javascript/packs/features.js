export default function() {
  $('.add-feature-button').click(function() {
    $('#new-feature-modal').modal('open');
  });

  $('#new-feature-modal').modal();
  $('#add-feature-submit-button').click(function() {
    var csrfToken         = $('#csrf_token').val();
    var name              = $('#name').val();
    var number            = $('#number').val();
    var description       = $('#description').val();
    var externalLink      = $('#external_link').val();
    var externalThumbnail = $('#external_thumbnail').val();
    var category          = $('#category').val();
    $.ajax({
      url: '/features',
      type: 'POST',
      data: {
        feature: {
          name:               name,
          number:             number,
          description:        description,
          external_link:      externalLink,
          external_thumbnail: externalThumbnail,
          category:           category
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

  var featureId = null;
  $('.remove-feature-button').click(function(e) {
    e.preventDefault();
    e.stopPropagation();
    featureId = $(e.target).attr('data-id');
    $('#remove-feature-modal').modal('open');
  });
  $('#remove-feature-modal').modal();
  $('#remove-feature-submit-button').click(function() {
    const csrfToken = $('#csrf_token').val();
    if (featureId) {
      $.ajax({
        url: `/features/${featureId}`,
        type: 'POST',
        data: {
          _method: 'DELETE',
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
    }
  });
}
