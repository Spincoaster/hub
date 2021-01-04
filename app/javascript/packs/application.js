/* eslint no-console:0 */
import Rails from 'rails-ujs';

import '../styles/application';
import navbar from './navbar';
import { restoreHistory, setupHistory } from './history_manager';
import { scrollToActive } from './scroll_manager';
import recordModal from './record_modal';
import trackModal from './track_modal';
import commentModal from './comment_modal';
import features from './features';
import featureEdit from './feature_edit';
import {
  trackArtistAutocomplete,
  trackAlbumAutocomplete,
  albumArtistAutocomplete,
  recordArtistAutocomplete,
} from './admin';

Rails.start();

$(function() {
  navbar();
  scrollToActive();
  features();
  featureEdit();
  trackArtistAutocomplete();
  trackAlbumAutocomplete();
  albumArtistAutocomplete();
  recordArtistAutocomplete();
  if (('standalone' in window.navigator) && window.navigator.standalone) {
    top.onload = restoreHistory;
    setupHistory();
  }
  $('.artist-item td.cell').click(function(e) {
    window.location = $(this).parent().find('a').attr('href');
  });
  $('.album-item td.cell').click(function(e) {
    window.location = $(this).parent().find('a').attr('href');
  });
  $('tr.owner-item').click(function(e) {
    if (e.target.tagName === 'A') { return; }
    window.location = $(this).find('a').attr('href');
  });
  $('.feature-item').click(function(e) {
    window.location = $(this).find('a').attr('href');
  });
  $('select').material_select();
  recordModal();
  trackModal();
  commentModal();
});
