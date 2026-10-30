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
  function avatarPath(row) {
    return typeof row.avatar_path === 'string' && /^\/files\/review-avatars\/[a-z0-9-]+\.webp$/.test(row.avatar_path) ? row.avatar_path : null;
  }
  function identityElement(row) {
    const identity = document.createElement('div');
    identity.className = 'review-identity';
    const name = row.name || row.customer_name || 'BBSILOG customer';
    const path = avatarPath(row);
    if (path) {
      const image = document.createElement('img');
      image.className = 'review-avatar'; image.src = path;
      image.alt = 'Profile picture supplied with this customer review';
      image.width = 48; image.height = 48; image.loading = 'lazy'; image.decoding = 'async';
      identity.append(image);
    }
    const label = document.createElement('b'); label.textContent = name;
    identity.append(label);
    return identity;
  }
  function reviewDuration(count) { return Math.max(48, count * 12) + 's'; }
  function matchesFilter(row, filter) {
    if (filter === 'archived') return Boolean(row.archived_at);
    if (row.archived_at) return false;
    if (filter === 'all') return true;
    if (filter === 'imported') return isImported(row);
    if (filter === 'private') return !mayFeature(row);
    return mayFeature(row) && row.status === filter;
  }
  root.BBSILOGReviewModel = Object.freeze({ isImported, mayFeature, ratingLabel, matchesFilter, avatarPath, identityElement, reviewDuration });
})(window);
