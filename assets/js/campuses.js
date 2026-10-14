(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const formModal = $("campusFormModal"), previewModal = $("campusPreviewModal"), form = $("campusForm"), tableBody = $("campusTableBody"), search = $("campusSearch");
  const pageSize = 5;
  let nextId = 3, editingId = null, currentImage = "", showAll = false;
  let campuses = [
    {id:1,name:"Main Campus",email:"",address:"South Campus, Caloocan City",contact:"(02) 8888-0000",location:"University of Caloocan City, South Campus",status:"Active",image:"",createdBy:"Admin",dateCreated:"2026-10-14",updatedBy:"—"},
    {id:2,name:"North Campus",email:"",address:"North Campus, Caloocan City",contact:"(02) 8888-0001",location:"University of Caloocan City, North Campus",status:"Active",image:"",createdBy:"Admin",dateCreated:"2026-10-14",updatedBy:"—"}
  ];
  const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const today = () => new Date().toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});
  function mapsUrl(value) { const raw = (value || "").trim(); if (!raw) return ""; return /^https?:\/\//i.test(raw) ? raw : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(raw); }
  function imageMarkup(image, alt) { return image ? `<img src="${safe(image)}" alt="${safe(alt)}">` : '<i data-lucide="image"></i>'; }
  function renderRows() {
    const term = search.value.trim().toLowerCase();
    const filtered = campuses.filter(c => [c.name,c.email,c.address,c.contact,c.location,c.status].join(" ").toLowerCase().includes(term));
    const shown = showAll ? filtered : filtered.slice(0,pageSize);
    tableBody.innerHTML = shown.map(c => {
      const map = mapsUrl(c.location);
      return `<tr data-campus-row data-id="${c.id}">
        <td><div class="campus-thumb ${c.image ? "" : "campus-no-image"}">${imageMarkup(c.image,c.name)}</div></td>
        <td><strong>${safe(c.name)}</strong><span class="campus-subtitle">${safe(c.email || c.address || "University of Caloocan City")}</span></td>
        <td>${safe(c.contact || "—")}</td>
        <td>${map ? `<a class="campus-map-link" href="${safe(map)}" target="_blank" rel="noopener noreferrer"><i data-lucide="map-pin"></i> View map</a>` : "<span>Not provided</span>"}<small>${safe(c.location || c.address || "")}</small></td>
        <td><span class="campus-status ${c.status === "Hidden" ? "is-hidden" : "is-active"}">${safe(c.status)}</span></td>
        <td><div class="campus-row-actions"><button class="campus-icon-btn campus-view" type="button" data-action="preview" aria-label="Preview ${safe(c.name)}" title="Preview"><i data-lucide="eye"></i></button><button class="campus-icon-btn campus-edit" type="button" data-action="edit" aria-label="Edit ${safe(c.name)}" title="Edit"><i data-lucide="pencil"></i></button><button class="campus-icon-btn campus-delete" type="button" data-action="delete" aria-label="Delete ${safe(c.name)}" title="Delete"><i data-lucide="trash-2"></i></button></div></td>
      </tr>`;
    }).join("");
    $("campusCount").textContent = filtered.length;
    $("campusEmptyState").hidden = filtered.length !== 0;
    $("campusShowMore").hidden = filtered.length <= pageSize;
    $("campusShowMore").textContent = showAll ? "Show less" : "Show more";
    // Show the end message whenever every matching record is currently visible.
    $("campusEndMessage").hidden = !(filtered.length > 0 && (showAll || filtered.length <= pageSize));
    if (window.lucide) window.lucide.createIcons();
  }
  function setOpen(modal, open) {
    modal.classList.toggle("is-open",open); modal.setAttribute("aria-hidden",String(!open));
    document.body.classList.toggle("campus-modal-open",formModal.classList.contains("is-open") || previewModal.classList.contains("is-open"));
  }
  function updateImagePreview() {
    const preview = $("campusImagePreview"); preview.replaceChildren();
    if (currentImage) { const img = document.createElement("img"); img.src = currentImage; img.alt = "Campus image preview"; preview.appendChild(img); preview.hidden = false; $("removeCampusImage").hidden = false; }
    else { preview.hidden = true; $("removeCampusImage").hidden = true; }
    syncCampusUploadLabel();
    if (window.lucide) window.lucide.createIcons();
  }
  function syncCampusUploadLabel() { const label = $("campusUploadLabel"); if (label) label.hidden = Boolean(currentImage); }
  function clearForm() {
    form.reset(); $("campusId").value = ""; editingId = null; currentImage = ""; $("campusImageInput").value = ""; updateImagePreview();
    $("campusFormTitle").textContent = "Add Campus"; $("saveCampusLabel").textContent = "Save Campus";
  }
  function openForm(campus = null) {
    clearForm();
    if (campus) {
      editingId = campus.id; $("campusId").value = campus.id;
      $("campusName").value = campus.name || ""; $("campusEmail").value = campus.email || ""; $("campusAddress").value = campus.address || "";
      $("campusContact").value = campus.contact || ""; $("campusLocation").value = campus.location || ""; $("campusStatus").value = campus.status || "Active";
      currentImage = campus.image || ""; updateImagePreview(); $("campusFormTitle").textContent = "Edit Campus"; $("saveCampusLabel").textContent = "Save Changes";
    }
    setOpen(formModal,true);
  }
  function readForm() {
    return {id:editingId || nextId, name:$("campusName").value.trim(), email:$("campusEmail").value.trim(), address:$("campusAddress").value.trim(), contact:$("campusContact").value.trim(), location:$("campusLocation").value.trim(), status:$("campusStatus").value, image:currentImage};
  }
  function showPreview(campus) {
    $("campusPreviewName").textContent = campus.name || "Campus name";
    $("campusPreviewEmail").textContent = campus.email ? "Email: " + campus.email : "";
    $("campusPreviewAddress").textContent = campus.address ? "Address: " + campus.address : "";
    $("campusPreviewContact").textContent = campus.contact || "No contact information provided.";
    $("campusPreviewStatus").textContent = campus.status || "Active";
    $("campusPreviewLocation").textContent = campus.location || "Not provided";
    const map = mapsUrl(campus.location), mapLink = $("campusPreviewMap"); mapLink.href = map || "#"; mapLink.hidden = !map;
    const imageBox = $("campusPreviewImage"); imageBox.replaceChildren();
    if (campus.image) { const img = document.createElement("img"); img.src = campus.image; img.alt = (campus.name || "Campus") + " image"; imageBox.appendChild(img); }
    else { const icon = document.createElement("i"); icon.setAttribute("data-lucide","image"); const label = document.createElement("span"); label.textContent = "No campus image selected"; imageBox.append(icon,label); }
    const saved = campus.id ? campuses.find(c => c.id === campus.id) : null;
    $("campusCreatedBy").textContent = saved?.createdBy || "Admin (new record)";
    $("campusDateCreated").textContent = saved?.dateCreated || "Not saved yet";
    $("campusUpdatedBy").textContent = saved?.updatedBy || (saved ? "—" : "Will be set when saved");
    if (window.lucide) window.lucide.createIcons(); setOpen(previewModal,true);
  }
  $("openCampusForm").addEventListener("click",() => openForm());
  document.querySelectorAll("[data-close-form]").forEach(btn => btn.addEventListener("click",() => {setOpen(formModal,false);clearForm();}));
  document.querySelectorAll("[data-close-preview]").forEach(btn => btn.addEventListener("click",() => setOpen(previewModal,false)));
  [formModal,previewModal].forEach(modal => modal.addEventListener("click",e => {if(e.target===modal){setOpen(modal,false);if(modal===formModal)clearForm();}}));
  $("chooseCampusImage").addEventListener("click",() => $("campusImageInput").click());
  $("campusImageInput").addEventListener("change",e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please choose a valid image file."); e.target.value=""; return; }
    const reader = new FileReader(); reader.onload = () => { if (typeof reader.result !== "string") {alert("Unable to load the selected image.");return;} currentImage=reader.result;updateImagePreview(); };
    reader.onerror = () => alert("An error occurred while reading the image."); reader.readAsDataURL(file);
  });
  $("removeCampusImage").addEventListener("click",() => {currentImage="";$("campusImageInput").value="";updateImagePreview();});
  $("previewCampusBtn").addEventListener("click",() => {if (!form.reportValidity()) return;showPreview(readForm());});
  form.addEventListener("submit",e => {
    e.preventDefault(); if (!form.reportValidity()) return;
    const values = readForm(), existing = editingId ? campuses.find(c => c.id === editingId) : null;
    if (existing) { Object.assign(existing,values,{createdBy:existing.createdBy,dateCreated:existing.dateCreated,updatedBy:"Admin"}); }
    else { values.id=nextId++; Object.assign(values,{createdBy:"Admin",dateCreated:today(),updatedBy:"—"}); campuses.push(values); }
    showAll=false; setOpen(formModal,false); clearForm(); renderRows();
  });
  tableBody.addEventListener("click",e => {
    const button=e.target.closest("[data-action]"); if(!button)return; const row=button.closest("tr"), campus=campuses.find(c=>c.id===Number(row.dataset.id)); if(!campus)return;
    if(button.dataset.action==="preview")showPreview(campus);
    if(button.dataset.action==="edit")openForm(campus);
    if(button.dataset.action==="delete"&&confirm(`Delete "${campus.name}"? This cannot be undone.`)){campuses=campuses.filter(c=>c.id!==campus.id);renderRows();}
  });
  search.addEventListener("input",() => {showAll=false;renderRows();});
  $("campusShowMore").addEventListener("click",() => {showAll=!showAll;renderRows();});
  document.addEventListener("keydown",e => {if(e.key==="Escape"){if(previewModal.classList.contains("is-open"))setOpen(previewModal,false);else if(formModal.classList.contains("is-open")){setOpen(formModal,false);clearForm();}}});
  if(window.lucide)window.lucide.createIcons(); renderRows();
})();
