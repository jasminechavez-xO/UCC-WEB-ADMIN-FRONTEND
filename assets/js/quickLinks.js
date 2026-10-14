(() => {
    "use strict";

  

    let quickLinks = [
        {
            name: "Aims Student Portal",
            url: "https://aims.ucc-caloocan.edu.ph/ucc/students/",
            order: 1,
            status: "Active",
            image: "",
            createdBy: "Admin",
            createdAt: new Date().toISOString(),
            updatedBy: "—",
            updatedAt: ""
        },
        {
            name: "Aims Faculty Portal",
            url: "https://aims.ucc-caloocan.edu.ph/ucc/faculty/",
            order: 2,
            status: "Active",
            image: "",
            createdBy: "Admin",
            createdAt: new Date().toISOString(),
            updatedBy: "—",
            updatedAt: ""
        },
        {
            name: "Caloocan City Website",
            url: "https://caloocancity.gov.ph/",
            order: 3,
            status: "Active",
            image: "",
            createdBy: "Admin",
            createdAt: new Date().toISOString(),
            updatedBy: "—",
            updatedAt: ""
        }
    ];

    const $ = id => document.getElementById(id);

    /* DOM ELEMENTS */

    const searchInput = $("quickSearch");
    const tableBody = $("quickLinksBody");
    const emptyState = $("quickEmpty");
    const endMessage = $("quickEndMessage");
    const showMoreBtn = $("showMoreBtn");
    const showLessBtn = $("showLessBtn");
    const totalLinks = $("totalLinks");

    const modal = $("quickModal");
    const modalTitle = $("modalTitle");
    const form = $("quickLinkForm");
    const editingIndex = $("editingIndex");

    const linkName = $("linkName");
    const linkUrl = $("linkUrl");
    const displayOrder = $("displayOrder");
    const linkStatus = $("linkStatus");

    const featuredImage = $("featuredImage");
    const selectedImagePreview = $("selectedImagePreview");
    const imageEmpty = document.querySelector(".quick-image-empty");
    const removeImageBtn = $("removeImageBtn");

    const quickMetadata = $("quickMetadata");
    const previewModal = $("quickPreviewModal");

    const toast = $("quickToast");
    const toastMessage = $("toastMessage");

    let currentImage = "";
    let expanded = false;
    const PAGE_SIZE = 5;

    /* UTILITIES */

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function validUrl(value) {
        try {
            const parsed = new URL(value.trim());
            return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
            return false;
        }
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function refreshIcons() {
        if (window.lucide) window.lucide.createIcons();
    }

    function showToast(message, error = false) {
        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;
        toast.classList.toggle("error", error);
        toast.classList.add("show");

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2800);
    }

    /* IMAGE PREVIEW */

    function updateImagePreview() {
        selectedImagePreview.src = currentImage || "";
        selectedImagePreview.hidden = !currentImage;

        imageEmpty.hidden = Boolean(currentImage);
        removeImageBtn.hidden = !currentImage;

        refreshIcons();
    }

    /* TABLE RENDERING */

    function renderLinks() {
        const query = searchInput.value.trim().toLowerCase();

        const filtered = quickLinks
            .map((link, originalIndex) => ({ ...link, originalIndex }))
            .filter(link =>
                !query ||
                link.name.toLowerCase().includes(query) ||
                link.url.toLowerCase().includes(query)
            )
            .sort((a, b) => Number(a.order) - Number(b.order));

        const visibleCount = expanded
            ? filtered.length
            : Math.min(PAGE_SIZE, filtered.length);

        const visibleLinks = filtered.slice(0, visibleCount);

        tableBody.innerHTML = "";

        visibleLinks.forEach(link => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td><span class="order-number">${escapeHtml(link.order)}</span></td>

                <td><span class="link-name">${escapeHtml(link.name)}</span></td>

                <td class="url-cell">
                    <a href="${escapeHtml(link.url)}"
                       target="_blank"
                       rel="noopener noreferrer"
                       title="${escapeHtml(link.url)}">
                        <i data-lucide="external-link"></i>
                        <span>${escapeHtml(link.url)}</span>
                    </a>
                </td>

                <td>
                    <span class="quick-status ${link.status === "Hidden" ? "hidden" : "active"}">
                        ${escapeHtml(link.status || "Active")}
                    </span>
                </td>

                <td>
                    <div class="table-actions">
                        <button class="icon-action view"
                                type="button"
                                title="View"
                                aria-label="View ${escapeHtml(link.name)}"
                                data-action="view"
                                data-index="${link.originalIndex}">
                            <i data-lucide="eye"></i>
                        </button>

                        <button class="icon-action edit"
                                type="button"
                                title="Edit"
                                aria-label="Edit ${escapeHtml(link.name)}"
                                data-action="edit"
                                data-index="${link.originalIndex}">
                            <i data-lucide="pencil"></i>
                        </button>

                        <button class="icon-action delete"
                                type="button"
                                title="Delete"
                                aria-label="Delete ${escapeHtml(link.name)}"
                                data-action="delete"
                                data-index="${link.originalIndex}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        totalLinks.textContent = quickLinks.length;

        const noResults = filtered.length === 0;
        const hasMore = filtered.length > visibleCount;
        const canShowLess = expanded && filtered.length > PAGE_SIZE;

        emptyState.hidden = !noResults;
        endMessage.hidden = noResults || hasMore;
        showMoreBtn.hidden = noResults || !hasMore;
        showLessBtn.hidden = !canShowLess;

        refreshIcons();
    }

    /* FORM VALIDATION */

    function clearErrors() {
        document.querySelectorAll(".field-error").forEach(element => {
            element.textContent = "";
        });

        document.querySelectorAll(".quick-form input, .quick-form select")
            .forEach(element => element.classList.remove("invalid"));
    }

    function setError(input, errorId, message) {
        input.classList.add("invalid");
        $(errorId).textContent = message;
    }

    function validateForm() {
        clearErrors();

        let valid = true;

        const name = linkName.value.trim();
        const url = linkUrl.value.trim();
        const order = Number(displayOrder.value);

        const currentIndex = editingIndex.value === ""
            ? -1
            : Number(editingIndex.value);

        if (!name) {
            setError(linkName, "linkNameError", "Link name is required.");
            valid = false;
        } else if (name.length < 2) {
            setError(
                linkName,
                "linkNameError",
                "Link name must contain at least 2 characters."
            );
            valid = false;
        }

        if (!url) {
            setError(linkUrl, "linkUrlError", "URL is required.");
            valid = false;
        } else if (!validUrl(url)) {
            setError(
                linkUrl,
                "linkUrlError",
                "Enter a valid http:// or https:// URL."
            );
            valid = false;
        }

        if (
            displayOrder.value.trim() === "" ||
            !Number.isInteger(order) ||
            order < 1
        ) {
            setError(
                displayOrder,
                "displayOrderError",
                "Display order must be a positive whole number."
            );
            valid = false;
        }

        const duplicate = quickLinks.some((link, index) =>
            index !== currentIndex &&
            link.url.trim().toLowerCase() === url.toLowerCase()
        );

        if (url && duplicate) {
            setError(
                linkUrl,
                "linkUrlError",
                "This URL is already in the quick links list."
            );
            valid = false;
        }

        return valid;
    }

    /* ADD / EDIT MODAL */

    function openModal(index = null) {
        clearErrors();
        form.reset();

        currentImage = "";
        featuredImage.value = "";

        // Metadata is hidden in both Add and Edit.
        quickMetadata.hidden = true;

        const isEditing = index !== null;
        modal.classList.toggle("edit-mode", isEditing);

        if (!isEditing) {
            modalTitle.textContent = "Add Quick Link";
            editingIndex.value = "";

            displayOrder.value = quickLinks.length
                ? Math.max(...quickLinks.map(link => Number(link.order) || 0)) + 1
                : 1;

            linkStatus.value = "Active";
        } else {
            const link = quickLinks[index];

            if (!link) {
                showToast("Unable to find this quick link.", true);
                return;
            }

            modalTitle.textContent = "Edit Quick Link";
            editingIndex.value = String(index);

            linkName.value = link.name || "";
            linkUrl.value = link.url || "";
            displayOrder.value = link.order || 1;
            linkStatus.value = link.status || "Active";

            currentImage = link.image || "";
        }

        updateImagePreview();

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        setTimeout(() => linkName.focus(), 50);
    }

    function closeModal() {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");

        document.body.classList.remove("modal-open");

        clearErrors();
        form.reset();

        editingIndex.value = "";
        currentImage = "";
        featuredImage.value = "";
        quickMetadata.hidden = true;

        updateImagePreview();
    }

    /* PREVIEW MODAL */

    function showPreview(link) {
        const previewImage = $("previewImage");

        previewImage.src = link.image || "";
        previewImage.hidden = !link.image;

        $("previewName").textContent = link.name || "Link name";
        $("previewUrl").textContent = link.url || "";

        const status = $("previewStatus");
        status.textContent = link.status || "Active";
        status.classList.toggle("hidden", link.status === "Hidden");

        const visitLink = $("previewVisitLink");
        const isValidPreviewUrl = validUrl(link.url || "");

        visitLink.href = isValidPreviewUrl ? link.url : "#";
        visitLink.hidden = !isValidPreviewUrl;

        $("previewCreatedBy").textContent = link.createdBy || "Admin";
        $("previewCreatedDate").textContent = formatDate(link.createdAt);
        $("previewUpdatedBy").textContent = link.updatedBy || "—";

        previewModal.classList.add("show");
        previewModal.setAttribute("aria-hidden", "false");

        refreshIcons();
    }

    function closePreview() {
        previewModal.classList.remove("show");
        previewModal.setAttribute("aria-hidden", "true");
    }

    /* SAVE LINK */

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (!validateForm()) return;

        const now = new Date().toISOString();
        const editing = editingIndex.value !== "";
        const index = Number(editingIndex.value);
        const existing = editing ? quickLinks[index] : null;

        if (editing && !existing) {
            showToast("Unable to update this link. Please try again.", true);
            return;
        }

        const data = {
            name: linkName.value.trim(),
            url: linkUrl.value.trim(),
            order: Number(displayOrder.value),
            status: linkStatus.value,
            image: currentImage,
            createdBy: existing?.createdBy || "Admin",
            createdAt: existing?.createdAt || now,
            updatedBy: editing ? "Admin" : "—",
            updatedAt: editing ? now : ""
        };

        if (editing) {
            quickLinks[index] = data;
            showToast("Quick link updated successfully.");
        } else {
            quickLinks.push(data);
            showToast("Quick link added successfully.");
        }

        expanded = false;
        closeModal();
        renderLinks();
    });

    /* TABLE ACTIONS */

    tableBody.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const index = Number(button.dataset.index);
        const link = quickLinks[index];

        if (!link) return;

        switch (button.dataset.action) {
            case "view":
                showPreview(link);
                break;

            case "edit":
                openModal(index);
                break;

            case "delete": {
                const confirmed = confirm(
                    `Delete "${link.name}" from the quick links?`
                );

                if (!confirmed) return;

                quickLinks.splice(index, 1);
                renderLinks();
                showToast("Quick link deleted successfully.");
                break;
            }
        }
    });

    /* IMAGE UPLOAD */

    $("chooseImageBtn").addEventListener("click", () => {
        featuredImage.click();
    });

    featuredImage.addEventListener("change", () => {
        const file = featuredImage.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("Please choose an image file.", true);
            featuredImage.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("Please choose an image smaller than 5 MB.", true);
            featuredImage.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            currentImage = String(reader.result || "");
            updateImagePreview();
        };

        reader.onerror = () => {
            showToast("Unable to read this image. Please try another file.", true);
        };

        reader.readAsDataURL(file);
    });

    $("removeImageBtn").addEventListener("click", () => {
        currentImage = "";
        featuredImage.value = "";
        updateImagePreview();
    });

    /* PREVIEW CURRENT FORM VALUES */

    $("previewLinkBtn").addEventListener("click", () => {
        const index = editingIndex.value === ""
            ? -1
            : Number(editingIndex.value);

        const existing = index >= 0 ? quickLinks[index] : null;

        showPreview({
            name: linkName.value.trim(),
            url: linkUrl.value.trim(),
            status: linkStatus.value,
            image: currentImage,
            createdBy: existing?.createdBy || "Admin",
            createdAt: existing?.createdAt || "",
            updatedBy: existing ? "Admin" : "—"
        });
    });

    /* MODAL CONTROLS */

    $("closePreviewBtn").addEventListener("click", closePreview);

    previewModal.addEventListener("click", event => {
        if (event.target === previewModal) closePreview();
    });

    searchInput.addEventListener("input", () => {
        expanded = false;
        renderLinks();
    });

    showMoreBtn.addEventListener("click", () => {
        expanded = true;
        renderLinks();
    });

    showLessBtn.addEventListener("click", () => {
        expanded = false;
        renderLinks();

        document.querySelector(".quick-links-card")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    $("addLinkBtn").addEventListener("click", () => openModal());
    $("closeModalBtn").addEventListener("click", closeModal);
    $("cancelModalBtn").addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeModal();
            closePreview();
        }
    });

    /* INITIAL RENDER */

    renderLinks();
})();