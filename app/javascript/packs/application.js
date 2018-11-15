/* eslint no-console:0 */

import '../styles/application';
import navbar from './navbar';
import { restoreHistory, setupHistory } from './history_manager';
import { scrollToActive } from './scroll_manager';
import recordModal from './record_modal';
import trackModal from './track_modal';
import commentModal from './comment_modal';
import features from './features';
import featureEdit from './feature_edit';

$(function() {
  navbar();
  scrollToActive();
  features();
  featureEdit();
  if (('standalone' in window.navigator) && window.navigator.standalone) {
    top.onload = restoreHistory;
    setupHistory();
  }
  $('.artist-item').click(function(e) {
    window.location = $(this).find('a').attr('href');
  });
  $('.album-item').click(function(e) {
    window.location = $(this).find('a').attr('href');
  });
  $('tr.owner-item').click(function(e) {
    if (e.target.tagName === 'A') { return; }
    window.location = $(this).find('a').attr('href');
  });
  $('.feature-item').click(function(e) {
    window.location = $(this).find('a').attr('href');
  });
  recordModal();
  trackModal();
  commentModal();
});
