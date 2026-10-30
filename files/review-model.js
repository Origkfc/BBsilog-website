(function (root) {
  'use strict';
  function isImported(row) {
    return row.source === 'messenger_import';
  }
  function mayFeature(row) {
    return row.publish_consent === true || (isImported(row) && row.owner_publication_approved === true);
  }
  function ratingLabel(row) {
    return Number.isInteger(row.rating) && row.rating >= 1 && row.rating <= 5
      ? '★'.repeat(row.rating)
      : isImported(row) ? 'Messenger review · No star rating provided' : 'No star rating provided';
  }
  function matchesFilter(row, filter) {
    if (filter === 'archived') return Boolean(row.archived_at);
    if (row.archived_at) return false;
    if (filter === 'all') return true;
    if (filter === 'imported') return isImported(row);
    if (filter === 'private') return !mayFeature(row);
    return mayFeature(row) && row.status === filter;
  }
  root.BBSILOGReviewModel = Object.freeze({ isImported, mayFeature, ratingLabel, matchesFilter });
})(window);
