/* eslint no-console:0 */

import '../styles/application';
import navbar from './navbar';
import { restoreHistory, setupHistory } from './history_manager';
import { scrollToActive } from './scroll_manager';
import recordModal from './record_modal';
import trackModal from './track_modal';
import commentModal from './comment_modal';
import features from './features';

$(function() {
  navbar();
  scrollToActive();
  features();
  if (('standalone' in window.navigator) && window.navigator.standalone) {
    top.onload = restoreHistory;
    setupHistory();
  }
  $('.artist-item').click(function(e) {
    window.location = $(e.target).parent().find('a').attr('href');
  });
  $('.album-item').click(function(e) {
    window.location = $(e.target).parent().find('a').attr('href');
  });
  $('tr.owner-item').click(function(e) {
    if (e.target.tagName === 'A') { return; }
    var $parent = $(e.target).parent();
    var $a = $parent.find('a');
    window.location = $a.attr('href');
  });
  recordModal();
  trackModal();
  commentModal();
});
