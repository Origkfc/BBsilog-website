'use strict';
const base = 'https://ufhblydcgwffwpwdlksm.supabase.co';
const key = 'sb_publishable_d10Qrzk0LHaoVYnttjtOyQ_g-049cX3';
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
async function updateFeedback(row, patch, button) {
  button.disabled = true;
  try {
    const updated = await request('/rest/v1/bbsilog_feedback?id=eq.' + encodeURIComponent(row.id), {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch)
    });
    if (!Array.isArray(updated) || updated.length !== 1) throw Error('Could not update this feedback.');
    await load();
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
    const title = document.createElement('strong');
    title.textContent = (row.customer_name || 'BBSILOG customer') + ' · ' + model.ratingLabel(row);
    const message = document.createElement('p');
    message.textContent = row.message;
    const detail = document.createElement('small');
    const publication = model.isImported(row)
      ? (row.owner_publication_approved ? 'Messenger screenshot · Publication approved by BBSILOG owner' : 'Messenger screenshot · Publication not approved')
      : (row.publish_consent ? 'Website feedback · Customer permission: Yes' : 'Private website feedback · No permission to feature');
    detail.textContent = publication + ' · ' + (row.archived_at ? 'archived' : row.status) + ' · ' + (model.isImported(row) ? 'Imported: ' : 'Submitted: ') + new Date(row.created_at).toLocaleString();
    if (row.source_reference) detail.title = row.source_reference;
    card.append(title, message, detail);
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
    feedbackRows = await request('/rest/v1/bbsilog_feedback?select=id,customer_name,rating,message,publish_consent,status,created_at,archived_at,source,source_reference,owner_publication_approved&order=created_at.desc,id.desc');
    render();
    say('');
  } catch (error) { say(error.message, true); }
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
