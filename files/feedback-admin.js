'use strict';
const base = 'https://ufhblydcgwffwpwdlksm.supabase.co';
const key = 'sb_publishable_d10Qrzk0LHaoVYnttjtOyQ_g-049cX3';
const photoBucket = 'bbsilog-feedback-photos';
const model = BBSILOGReviewModel;
let token = sessionStorage.getItem('bbsilog_feedback_token') || null;
let feedbackRows = [];
let currentFilter = 'all';
const status = document.getElementById('status');
function say(message, error = false) {
  status.textContent = message;
  status.className = error ? 'error' : 'note';
}
async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: { apikey: key, Authorization: 'Bearer ' + (token || key), 'Content-Type': 'application/json', ...options.headers }
  });
  if (!response.ok) throw Error('Request failed (' + response.status + '). Check project setup or admin access.');
  return response.status === 204 ? null : response.json();
}
async function updateFeedback(row, patch, button, successMessage = '') {
  button.disabled = true;
  try {
    const updated = await request('/rest/v1/bbsilog_feedback?id=eq.' + encodeURIComponent(row.id), {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch)
    });
    if (!Array.isArray(updated) || updated.length !== 1) throw Error('Could not update this feedback.');
    await load();
    if (successMessage) say(successMessage);
  } catch (error) {
    say(error.message, true);
    button.disabled = false;
  }
}
function render() {
  const filters = document.getElementById('filters');
  filters.replaceChildren();
  const choices = [['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['imported', 'Messenger imports'], ['private', 'Private'], ['rejected', 'Not featured'], ['archived', 'Deleted / Archived']];
  for (const [value, label] of choices) {
    const count = feedbackRows.filter(row => model.matchesFilter(row, value)).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = value === currentFilter ? 'active' : '';
    button.setAttribute('aria-pressed', String(value === currentFilter));
    button.textContent = label + ' (' + count + ')';
    button.addEventListener('click', () => { currentFilter = value; render(); });
    filters.append(button);
  }
  const list = document.getElementById('list');
  list.replaceChildren();
  const rows = feedbackRows.filter(row => model.matchesFilter(row, currentFilter));
  if (!rows.length) { list.textContent = 'No feedback in this category.'; return; }
  for (const row of rows) {
    const card = document.createElement('article');
    card.className = 'review';
    const title = model.identityElement(row);
    const nameLabel = title.querySelector('b');
    const editName = document.createElement('button');
    editName.type = 'button';
    editName.className = 'edit-name-button';
    editName.textContent = '✎';
    editName.title = 'Edit customer name';
    editName.setAttribute('aria-label', 'Edit customer name');
    const nameEditor = document.createElement('form');
    nameEditor.className = 'name-editor';
    nameEditor.hidden = true;
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 80;
    nameInput.autocomplete = 'off';
    nameInput.setAttribute('aria-label', 'Customer name');
    nameInput.value = row.customer_name || '';
    const saveName = document.createElement('button');
    saveName.type = 'submit';
    saveName.textContent = 'Save name';
    const cancelName = document.createElement('button');
    cancelName.type = 'button';
    cancelName.className = 'secondary';
    cancelName.textContent = 'Cancel';
    editName.addEventListener('click', () => {
      nameInput.value = row.customer_name || '';
      nameEditor.hidden = false;
      editName.hidden = true;
      nameInput.focus();
      nameInput.select();
    });
    cancelName.addEventListener('click', () => {
      nameEditor.hidden = true;
      editName.hidden = false;
    });
    nameEditor.addEventListener('submit', event => {
      event.preventDefault();
      const customerName = nameInput.value.trim();
      if (customerName.length > 80) {
        say('Customer name must be 80 characters or fewer.', true);
        return;
      }
      updateFeedback(row, { customer_name: customerName || null }, saveName, 'Customer name updated. The public review will show the new name.');
    });
    title.append(editName);
    nameEditor.append(nameInput, saveName, cancelName);
    const rating = document.createElement('span');
    rating.className = 'review-rating'; rating.textContent = model.ratingLabel(row);
    const message = document.createElement('p');
    message.textContent = row.message;
    const detail = document.createElement('small');
    const publication = model.isImported(row)
      ? (row.owner_publication_approved ? 'Messenger screenshot · Publication approved by BBSILOG owner' : 'Messenger screenshot · Publication not approved')
      : (row.publish_consent ? 'Website feedback · Customer permission: Yes' : 'Private website feedback · No permission to feature');
    detail.textContent = publication + ' · ' + (row.archived_at ? 'archived' : row.status) + ' · ' + (model.isImported(row) ? 'Imported: ' : 'Submitted: ') + new Date(row.created_at).toLocaleString();
    if (row.source_reference) detail.title = row.source_reference;
    card.append(title, nameEditor);
    if (row.photo_path) {
      const photo = document.createElement('img');
      photo.className = 'admin-review-photo ' + (row.photo_layout === 'groupie' ? 'groupie' : 'selfie');
      photo.alt = row.photo_layout === 'groupie' ? 'Customer group photo' : 'Customer selfie';
      photo.hidden = true;
      card.append(photo);
      loadReviewPhoto(row.photo_path).then(url => {
        if (!photo.isConnected) return;

        photo.onerror = () => { photo.alt = 'Customer photo unavailable. Refresh to try again.'; };
        photo.src = url;
        photo.hidden = false;
      }).catch(() => {
        if (!photo.isConnected) return;
        const unavailable = document.createElement('p');
        unavailable.className = 'admin-photo-unavailable';
        unavailable.textContent = 'Customer photo could not be loaded. Refresh the inbox to try again.';
        photo.replaceWith(unavailable);
      });
    }
    card.append(rating, message, detail);
    if (model.mayFeature(row) && !row.archived_at) {
      for (const [label, state] of [['Approve & feature', 'approved'], ['Remove from website', 'rejected']]) {
        const button = document.createElement('button');
        button.textContent = label;
        button.disabled = row.status === state;
        button.addEventListener('click', () => updateFeedback(row, { status: state }, button));
        card.append(button);
      }
    }
    const archive = document.createElement('button');
    archive.className = 'danger';
    archive.textContent = row.archived_at ? 'Restore feedback' : 'Move to archive';
    archive.addEventListener('click', () => updateFeedback(row, { archived_at: row.archived_at ? null : new Date().toISOString(), status: 'pending' }, archive));
    card.append(archive);
    list.append(card);
  }
}
async function load() {
  say('Loading feedback…');
  try {
    feedbackRows = await request('/rest/v1/bbsilog_feedback?select=id,customer_name,rating,message,publish_consent,status,created_at,archived_at,source,source_reference,owner_publication_approved,avatar_path,photo_path,photo_layout,photo_consent&order=created_at.desc,id.desc');
    render();
    say('');
  } catch (error) { say(error.message, true); }
}
async function loadReviewPhoto(path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const data = await request('/storage/v1/object/sign/' + photoBucket + '/' + encodedPath, {
    method: 'POST', body: JSON.stringify({ expiresIn: 3600 })
  });
  const signed = data.signedURL || data.signedUrl;
  if (!signed) throw Error('Photo URL was unavailable.');
  return signed.startsWith('http') ? signed : base + (signed.startsWith('/storage/v1/') ? '' : '/storage/v1') + signed;
}
function showInbox() {
  document.getElementById('login').hidden = true;
  document.getElementById('inbox').hidden = false;
}
document.getElementById('loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  say('Signing in…');
  try {
    const result = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: document.getElementById('email').value.trim(), password: document.getElementById('password').value }) });
    token = result.access_token;
    if (!await request('/rest/v1/rpc/bbsilog_is_feedback_admin', { method: 'POST', body: '{}' })) throw Error('Account is not authorized.');
    sessionStorage.setItem('bbsilog_feedback_token', token);
    document.getElementById('password').value = '';
    showInbox();
    await load();
  } catch {
    token = null;
    sessionStorage.removeItem('bbsilog_feedback_token');
    say('Sign-in failed. Check the admin account and password.', true);
  }
});
document.getElementById('refresh').addEventListener('click', load);
document.getElementById('logout').addEventListener('click', () => {
  token = null;
  sessionStorage.removeItem('bbsilog_feedback_token');
  document.getElementById('inbox').hidden = true;
  document.getElementById('login').hidden = false;
  document.getElementById('list').replaceChildren();
  say('Signed out on this page.');
});
if (token) {
  request('/rest/v1/rpc/bbsilog_is_feedback_admin', { method: 'POST', body: '{}' }).then(ok => {
    if (!ok) throw Error('Not authorized');
    showInbox();
    return load();
  }).catch(() => {
    token = null;
    sessionStorage.removeItem('bbsilog_feedback_token');
    say('Session expired. Please sign in again.', true);
  });
}
