export default function() {
  $('#comment-modal').modal();
  $('.comment-item').click(function(e) {
    e.stopPropagation();
    var $parent = $(e.target).closest('.comment-item');
    var text = $parent.find('.comment').text();
    $('#comment-content').text(text);
    $('#comment-modal').modal('open');
    console.log(text);
  });
}
