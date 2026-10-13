import { markdownToHtml } from './markdown.js';
const $ = s => document.querySelector(s);
const els = { editor: $('#editor'), title: $('#doc-title'), sidebar: $('#sidebar-docs'), stage: $('#document-stage'), empty: $('#empty-state'), toast: $('#toast'), save: $('#save-state'), modal: $('#share-modal') };
let currentUser = 'ashish', currentId = null, documents = [], saving = false, dirty = false, saveTimer, toastTimer;
const initials = { ashish: 'AK', maya: 'MC', jordan: 'JL' }, colors = ['#e5eee5:#52705c','#eee8df:#85694c','#e7e9f1:#626b8b'];
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser, ...(options.headers || {}) } });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Something went wrong.'); return data;
}
function notify(message) { els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600); }
function setSave(label, state = '') { els.save.innerHTML = `<span class="save-dot ${state}"></span> ${label}`; }
function wordCount() { const text = els.editor.innerText.trim(); $('#word-count').textContent = `${text ? text.split(/\s+/).length : 0} words`; }
function renderList() {
  $('#page-count').textContent = documents.length;
  els.sidebar.innerHTML = documents.map(d => `<button class="side-doc ${d.id === currentId ? 'selected' : ''}" data-id="${d.id}"><span class="side-icon">â–¤</span><span class="side-title">${escapeHtml(d.title)}</span>${d.access === 'shared' ? '<span class="shared-dot">â—</span>' : ''}</button>`).join('');
  els.sidebar.querySelectorAll('.side-doc').forEach(b => b.onclick = () => openDocument(b.dataset.id));
}
async function loadList() { documents = (await api('/api/documents')).documents; renderList(); }
async function flushPendingSave() {
  clearTimeout(saveTimer);
  let attempts = 0;
  while (saving && attempts < 100) { await new Promise(resolve => setTimeout(resolve, 20)); attempts++; }
  while (dirty && attempts < 100) {
    clearTimeout(saveTimer);
    const saved = await saveNow();
    if (!saved) return false;
    attempts++;
    while (saving && attempts < 100) { await new Promise(resolve => setTimeout(resolve, 20)); attempts++; }
  }
  return !dirty && !saving;
}
async function openDocument(id) {
  if (currentId && (dirty || saving) && !(await flushPendingSave())) { notify('Your changes could not be saved. Stay here and try again.'); return; }
  try { const { document: d } = await api(`/api/documents/${id}`); currentId = id; els.title.value = d.title; els.editor.innerHTML = d.content; const editable = d.access === 'owner' || d.permission === 'editor'; els.title.readOnly = !editable; els.editor.contentEditable = String(editable); document.querySelectorAll('.toolbar button,.toolbar select').forEach(el => el.disabled = !editable); els.editor.classList.toggle('read-only',!editable); els.stage.classList.remove('hidden'); els.empty.classList.add('hidden'); $('#crumb-title').textContent = d.title; $('#access-label').textContent = d.access === 'owner' ? 'OWNED BY YOU' : (d.permission === 'editor' ? 'SHARED Â· EDITOR' : 'SHARED Â· VIEWER'); $('#updated-label').textContent = 'Edited ' + relativeTime(d.updatedAt); $('#share-open').classList.toggle('hidden', d.access !== 'owner'); $('#avatar-stack').innerHTML = d.collaborators.map((p,i) => `<div class="avatar" style="background:${colors[i%3].split(':')[0]};color:${colors[i%3].split(':')[1]}" title="${escapeHtml(p.name)} Â· ${p.permission}">${p.initials}</div>`).join(''); renderList(); wordCount(); setSave('All changes saved'); }
  catch(e) { notify(e.message); }
}
function relativeTime(date) { const minutes = Math.floor((Date.now()-new Date(date))/60000); return minutes < 1 ? 'just now' : minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes/60)}h ago`; }
async function createDocument(title = 'Untitled page', content = '<p>Start writing something worth sharing.</p>') {
  try { const { document:d } = await api('/api/documents', { method:'POST', body:JSON.stringify({title,content}) }); await loadList(); await openDocument(d.id); els.title.focus(); els.title.select(); }
  catch(e) { notify(e.message); }
}
function scheduleSave() { if (!currentId) return; dirty = true; setSave('Savingâ€¦','saving'); clearTimeout(saveTimer); saveTimer=setTimeout(saveNow,650); }
async function saveNow() {
  if (!currentId || saving || !dirty) return !dirty; saving=true; dirty=false;
  let saved = false;
  try { await api(`/api/documents/${currentId}`,{method:'PATCH',body:JSON.stringify({title:els.title.value,content:els.editor.innerHTML})}); $('#crumb-title').textContent=els.title.value; setSave('All changes saved'); await loadList(); saved = true; }
  catch(e) { dirty=true; setSave('Could not save','error'); notify(e.message); }
  finally { saving=false; if(dirty && saved) setTimeout(saveNow,300); }
  return saved;
}
function openShare() { if (!currentId) return; els.modal.classList.remove('hidden'); $('#share-email').focus(); renderPeople(); }
async function renderPeople() {
  try { const {document:d}=await api(`/api/documents/${currentId}`); const owner=(await api('/api/session')).users.find(u=>u.id===d.ownerId); const people=[{...owner,permission:'owner'},...d.collaborators]; $('#people-list').innerHTML=people.map((p,i)=>`<div class="person-row"><div class="avatar" style="background:${colors[i%3].split(':')[0]};color:${colors[i%3].split(':')[1]}">${p.initials}</div><div class="person-info"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.email)}</span></div><span class="person-role">${p.permission}</span></div>`).join(''); }
  catch(e) { $('#share-error').textContent=e.message; }
}
$('#share-form').onsubmit=async e=>{e.preventDefault();$('#share-error').textContent='';try{await api(`/api/documents/${currentId}/share`,{method:'POST',body:JSON.stringify({email:$('#share-email').value,permission:$('#share-permission').value})});$('#share-email').value='';await renderPeople();await openDocument(currentId);notify('Invite sent. Your teammate now has access.');}catch(err){$('#share-error').textContent=err.message;}};
$('#share-open').onclick=openShare; $('#share-close').onclick=()=>els.modal.classList.add('hidden'); els.modal.onclick=e=>{if(e.target===els.modal)els.modal.classList.add('hidden');};
$('#new-doc-side').addEventListener('click', () => createDocument());
$('#empty-create').addEventListener('click', () => createDocument());
$('#new-doc-top').addEventListener('click', () => createDocument());
function openFilePicker() {
  const picker = $('#file-input');
  if (!picker || typeof picker.click !== 'function') { notify('File import is unavailable in this browser.'); return; }
  picker.value = '';
  picker.click();
}
$('#import-file-side').addEventListener('click', openFilePicker);
$('#import-file-top').addEventListener('click', openFilePicker);
$('#account-select').onchange=async e=>{const nextUser=e.target.value;if(currentId&&(dirty||saving)&&!(await flushPendingSave())){e.target.value=currentUser;notify('Your changes could not be saved. Stay on this account and try again.');return;}currentUser=nextUser;$('#profile-name').textContent=({ashish:'Ashish Kumar',maya:'Maya Chen',jordan:'Jordan Lee'})[currentUser];$('#profile-avatar').textContent=initials[currentUser];currentId=null;await loadList();if(documents.length)openDocument(documents[0].id);else{els.stage.classList.add('hidden');els.empty.classList.remove('hidden');}};
els.title.addEventListener('input',scheduleSave); els.editor.addEventListener('input',()=>{wordCount();scheduleSave();});
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>{els.editor.focus();document.execCommand(b.dataset.command,false,null);b.classList.toggle('active');scheduleSave();});
$('#format-block').onchange=e=>{els.editor.focus();document.execCommand('formatBlock',false,e.target.value);scheduleSave();};
$('#file-input').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!/\.(txt|md)$/i.test(file.name)) { notify('Choose a .txt or .md file to import.'); e.target.value = ''; return; }
  if (file.size > 60_000) { notify('Please choose a .txt or .md file smaller than 60 KB.'); e.target.value = ''; return; }
  try {
    const text = await file.text();
    const html = /\.md$/i.test(file.name) ? markdownToHtml(text) : `<p>${escapeHtml(text).replace(/\r?\n/g, '</p><p>')}</p>`;
    const { document: created } = await api('/api/documents', { method: 'POST', body: JSON.stringify({ title: file.name.replace(/\.(txt|md)$/i, ''), content: html }) });
    await loadList();
    await openDocument(created.id);
    notify(/\.md$/i.test(file.name) ? 'Markdown imported with headings, emphasis, and lists.' : 'Text file imported as a new page.');
  } catch (error) { notify(error.message || 'We could not read that file.'); }
  finally { e.target.value = ''; }
});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['b','i','u'].includes(e.key.toLowerCase())&&document.activeElement===els.editor){e.preventDefault();document.execCommand(e.key.toLowerCase());scheduleSave();}if(e.key==='Escape')els.modal.classList.add('hidden');});
async function init(){try{const {currentUser:u}=await api('/api/session');currentUser=u.id;await loadList();if(documents.length)await openDocument(documents[0].id);else{els.stage.classList.add('hidden');els.empty.classList.remove('hidden');}}catch(e){notify(e.message);}}
init();
