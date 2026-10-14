(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const formModal = $("contactFormModal");
  const previewModal = $("contactPreviewModal");
  const form = $("contactForm");
  const tableBody = $("contactTableBody");
  const search = $("contactSearch");
  const categoryFilter = $("categoryFilter");
  const statusFilter = $("statusFilter");

  const pageSize = 5;
  let showAll = false;
  let nextId = 6;
  let editingId = null;

  const nowText = () => new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  let contacts = [
    {
      id: 1, name: "University Registrar", email: "registrar@ucc.edu.ph",
      number: "(02) 5310 1234", category: "Offices", status: "Active",
      location: "", createdBy: "Administrator", createdAt: "Oct 14, 2026",
      updatedBy: "Not updated"
    },
    {
      id: 2, name: "Admissions Office", email: "admissions@ucc.edu.ph",
      number: "(02) 5310 1235", category: "Offices", status: "Active",
      location: "", createdBy: "Administrator", createdAt: "Oct 14, 2026",
      updatedBy: "Not updated"
    },
    {
      id: 3, name: "College of Liberal Arts and Sciences", email: "clas@ucc.edu.ph",
      number: "(02) 5310 1236", category: "Colleges", status: "Active",
      location: "", createdBy: "Administrator", createdAt: "Oct 14, 2026",
      updatedBy: "Not updated"
    },
    {
      id: 4, name: "South Campus", email: "southcampus@ucc.edu.ph",
      number: "(02) 5310 1237", category: "Campus", status: "Hidden",
      location: "University of Caloocan City South Campus, Caloocan City",
      createdBy: "Administrator", createdAt: "Oct 14, 2026",
      updatedBy: "Not updated"
    },
    {
      id: 5, name: "North Campus", email: "northcampus@ucc.edu.ph",
      number: "(02) 5310 1238", category: "Campus", status: "Active",
      location: "University of Caloocan City North Campus, Caloocan City",
      createdBy: "Administrator", createdAt: "Oct 14, 2026",
      updatedBy: "Not updated"
    }
  ];

  const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function mapsUrl(value) {
    const raw = (value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return "https://www.google.com/maps?q=" + encodeURIComponent(raw);
  }

  function embedUrl(value) {
    const raw = (value || "").trim();
    if (!raw) return "";
    return "https://maps.google.com/maps?q=" + encodeURIComponent(raw) + "&output=embed";
  }

  function filteredContacts() {
    const term = search.value.trim().toLowerCase();

    return contacts.filter(contact => {
      const matchesSearch = !term || [
        contact.name, contact.email, contact.number,
        contact.category, contact.status, contact.location
      ].join(" ").toLowerCase().includes(term);

      const matchesCategory = !categoryFilter.value ||
        contact.category === categoryFilter.value;

      const matchesStatus = !statusFilter.value ||
        contact.status === statusFilter.value;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  function render() {
    const rows = filteredContacts();
    const visible = showAll ? rows : rows.slice(0, pageSize);

    tableBody.innerHTML = visible.map(contact => `
      <tr data-id="${contact.id}">
        <td>
          <div class="contact-name-cell">
            <strong>${safe(contact.name)}</strong>
            <small>Contact #${contact.id}</small>
          </div>
        </td>
        <td>${safe(contact.email)}</td>
        <td>${safe(contact.number)}</td>
        <td>${safe(contact.category)}</td>
        <td>
          <span class="contact-status ${contact.status === "Hidden" ? "hidden" : "active"}">
            ${safe(contact.status)}
          </span>
        </td>
        <td>
          <div class="contact-row-actions">
            <button class="contact-icon-btn view" type="button" data-action="preview"
              aria-label="Preview ${safe(contact.name)}" title="Preview">
              <i data-lucide="eye"></i>
            </button>
            <button class="contact-icon-btn edit" type="button" data-action="edit"
              aria-label="Edit ${safe(contact.name)}" title="Edit">
              <i data-lucide="pencil"></i>
            </button>
            <button class="contact-icon-btn delete" type="button" data-action="delete"
              aria-label="Delete ${safe(contact.name)}" title="Delete">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join("");

    $("contactCountLabel").textContent =
      `${rows.length} ${rows.length === 1 ? "Contact" : "Contacts"}`;

    $("contactEmptyState").hidden = rows.length !== 0;

    const moreButton = $("showMoreContacts");
    const endMessage = $("contactEndMessage");

    moreButton.hidden = rows.length <= pageSize;
    moreButton.textContent = showAll ? "Show less" : "Show more";
    moreButton.setAttribute("aria-expanded", String(showAll));

    endMessage.hidden =
      rows.length === 0 || (!showAll && rows.length > pageSize);

    if (window.lucide) window.lucide.createIcons();
  }

  function setOpen(modal, open) {
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", String(!open));

    document.body.classList.toggle(
      "contact-modal-open",
      formModal.classList.contains("is-open") ||
      previewModal.classList.contains("is-open")
    );
  }

  function syncCampusLocation() {
    const isCampus = $("contactCategory").value === "Campus";
    $("campusLocationField").hidden = !isCampus;

    if (!isCampus) {
      $("contactLocation").value = "";
      $("contactLocationCaption").hidden = true;
      $("contactMapFrame").innerHTML = `
        <div class="contact-map-placeholder">
          <i data-lucide="map-pin"></i>
          <span>Map is available for campus contacts only.</span>
        </div>`;
    } else {
      updateMap();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function updateMap() {
    const value = $("contactLocation").value.trim();
    const frame = $("contactMapFrame");
    const caption = $("contactLocationCaption");
    caption.textContent = value;
    caption.hidden = !value;

    const url = embedUrl(value);
    frame.innerHTML = url ? `
      <iframe title="Campus location map" loading="lazy"
        referrerpolicy="no-referrer-when-downgrade" src="${safe(url)}"></iframe>
    ` : `
      <div class="contact-map-placeholder">
        <i data-lucide="map-pin"></i>
        <span>Enter a campus address or Google Maps link to preview the location.</span>
      </div>`;

    if (window.lucide) window.lucide.createIcons();
  }

  function clearForm() {
    form.reset();
    $("contactId").value = "";
    editingId = null;
    $("contactFormTitle").textContent = "Add Contact";
    $("saveContactLabel").textContent = "Save Contact";
    $("contactCategory").value = "Campus";
    syncCampusLocation();
  }

  function openForm(contact = null) {
    clearForm();

    if (contact) {
      editingId = contact.id;
      $("contactId").value = contact.id;
      $("contactName").value = contact.name;
      $("contactEmail").value = contact.email;
      $("contactNumber").value = contact.number;
      $("contactCategory").value = contact.category;
      $("contactStatus").value = contact.status;
      $("contactLocation").value = contact.location || "";
      $("contactFormTitle").textContent = "Edit Contact";
      $("saveContactLabel").textContent = "Save Changes";
      syncCampusLocation();
    }

    setOpen(formModal, true);
  }

  function showPreview(contact) {
    $("previewContactName").textContent = contact.name || "Contact name";
    $("previewContactEmail").textContent = contact.email || "Not provided";
    $("previewContactNumber").textContent = contact.number || "Not provided";
    $("previewContactCategory").textContent = contact.category || "Category";

    const status = $("previewContactStatus");
    status.textContent = contact.status || "Active";
    status.className = "contact-status " +
      (contact.status === "Hidden" ? "hidden" : "active");

    const location = contact.category === "Campus" ? (contact.location || "") : "";
    const locationSection = $("previewLocationSection");
    locationSection.hidden = !location;
    $("previewContactLocation").textContent = location;

    const mapEmbed = embedUrl(location);
    $("previewMapFrame").innerHTML = location && mapEmbed ? `
      <iframe title="Campus location map" loading="lazy"
        referrerpolicy="no-referrer-when-downgrade" src="${safe(mapEmbed)}"></iframe>
    ` : "";

    const mapLink = $("previewContactMapLink");
    mapLink.href = mapsUrl(location) || "#";
    mapLink.hidden = !location;

    $("previewCreatedBy").textContent = contact.createdBy || "Administrator";
    $("previewCreatedAt").textContent = contact.createdAt || "—";
    $("previewUpdatedBy").textContent = contact.updatedBy || "Not updated";

    setOpen(previewModal, true);
    if (window.lucide) window.lucide.createIcons();
  }

  $("openContactForm").addEventListener("click", () => openForm());

  document.querySelectorAll("[data-close-form]").forEach(button => {
    button.addEventListener("click", () => {
      setOpen(formModal, false);
      clearForm();
    });
  });

  document.querySelectorAll("[data-close-preview]").forEach(button => {
    button.addEventListener("click", () => setOpen(previewModal, false));
  });

  [formModal, previewModal].forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        setOpen(modal, false);
        if (modal === formModal) clearForm();
      }
    });
  });

  $("contactCategory").addEventListener("change", syncCampusLocation);
  $("contactLocation").addEventListener("input", updateMap);

  $("previewContactBtn").addEventListener("click", () => {
    if (!form.reportValidity()) return;

    const existing = contacts.find(contact => contact.id === editingId);

    showPreview({
      name: $("contactName").value.trim(),
      email: $("contactEmail").value.trim(),
      number: $("contactNumber").value.trim(),
      category: $("contactCategory").value,
      status: $("contactStatus").value,
      location: $("contactLocation").value.trim(),
      createdBy: existing?.createdBy || "Administrator",
      createdAt: existing?.createdAt || nowText(),
      updatedBy: existing ? "Administrator" : "Not updated"
    });
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const oldContact = contacts.find(contact => contact.id === editingId);

    const contact = {
      id: editingId || nextId++,
      name: $("contactName").value.trim(),
      email: $("contactEmail").value.trim(),
      number: $("contactNumber").value.trim(),
      category: $("contactCategory").value,
      status: $("contactStatus").value,
      location: $("contactCategory").value === "Campus"
        ? $("contactLocation").value.trim()
        : "",
      createdBy: oldContact?.createdBy || "Administrator",
      createdAt: oldContact?.createdAt || nowText(),
      updatedBy: oldContact ? "Administrator" : "Not updated"
    };

    if (editingId) {
      contacts = contacts.map(item => item.id === editingId ? contact : item);
    } else {
      contacts.push(contact);
    }

    showAll = false;
    setOpen(formModal, false);
    clearForm();
    render();
  });

  tableBody.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const row = button.closest("tr");
    const id = Number(row?.dataset.id);
    const contact = contacts.find(item => item.id === id);
    if (!contact) return;

    if (button.dataset.action === "preview") showPreview(contact);
    if (button.dataset.action === "edit") openForm(contact);

    if (button.dataset.action === "delete" &&
        confirm(`Delete "${contact.name}"? This cannot be undone.`)) {
      contacts = contacts.filter(item => item.id !== id);
      render();
    }
  });

  $("showMoreContacts").addEventListener("click", () => {
    showAll = !showAll;
    render();
  });

  search.addEventListener("input", () => {
    showAll = false;
    render();
  });

  [categoryFilter, statusFilter].forEach(filter => {
    filter.addEventListener("change", () => {
      showAll = false;
      render();
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (previewModal.classList.contains("is-open")) {
      setOpen(previewModal, false);
    } else if (formModal.classList.contains("is-open")) {
      setOpen(formModal, false);
      clearForm();
    }
  });

  syncCampusLocation();
  render();
})();
