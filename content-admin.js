/* =========================================================
   BASANTA DRY CLEANLINESS
   CONTENT ADMIN JS — PART 1/6
========================================================= */

"use strict";


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL = window.BASANTA_CONFIG?.SUPABASE_URL || "https://ubsyhqkefhtskxjpjzbf.supabase.co";
const SUPABASE_ANON_KEY = window.BASANTA_CONFIG?.SUPABASE_ANON_KEY || "sb_publishable_hCW9e5LLUWNnQaKDxCP5eg_1tUpo5Tr";

const supabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase config missing: SUPABASE_URL और SUPABASE_ANON_KEY भरें।");
}


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function setMessage(id, message, success = true) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.style.color = success ? "#176b52" : "#c0392b";
  el.style.marginTop = "10px";
  el.style.fontSize = "13px";
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showImagePreview(elementId, url) {
  const el = $(elementId);
  if (!el) return;

  if (!url) {
    el.innerHTML = "<span>No image selected</span>";
    return;
  }

  el.innerHTML = `
    <img
      src="${escapeHTML(url)}"
      alt="Preview"
      style="max-width:100%;max-height:220px;object-fit:cover;border-radius:10px;"
    >
  `;
}


/* =========================================================
   IMAGE UPLOAD
========================================================= */

const CONTENT_BUCKET = "website-image";

async function uploadImage(file, folder = "general") {
  if (!file || !supabaseClient) return null;

  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error } = await supabaseClient
      .storage
      .from(CONTENT_BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg"
      });

    if (error) {
      console.error("Upload error:", error);
      alert("Image upload failed:\n" + error.message);
      return null;
    }

    const { data } = supabaseClient
      .storage
      .from(CONTENT_BUCKET)
      .getPublicUrl(fileName);

    return data?.publicUrl || null;
  } catch (e) {
    console.error("Upload exception:", e);
    return null;
  }
}


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  console.log("Basanta Content Admin Loaded");

  if (!supabaseClient) {
    console.error("Supabase config missing.");
    return;
  }

  await loadHomepage();
  await loadStats();
  await loadServices();
  await loadArticles();
  await loadPrices();
  await loadSteps();
  await loadContact();
  await loadFooterLinks();
  await loadReviews();
  await loadPageViews();

  setupHomepage();
  setupStats();
  setupServices();
  setupArticles();
  setupPrices();
  setupSteps();
  setupContact();
  setupFooterLinks();
  setupReviews();

  attachGlobalFunctions();
});
/* =========================================================
   BASANTA DRY CLEANLINESS
   CONTENT ADMIN JS — PART 2/6
========================================================= */


/* =========================================================
   PAGE VIEWS LOAD
========================================================= */

async function loadPageViews() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from("page_views")
      .select("*")
      .order("views", { ascending: false });

    if (error) {
      console.error("Page views load error:", error);
      return;
    }

    if (!data || data.length === 0) {
      const detailEl = $("pageViewsDetail");
      if (detailEl) {
        detailEl.innerHTML = `
          <div style="padding:20px;text-align:center;color:#8a9993;font-size:13px;">
            Abhi koi views nahi hain.
          </div>
        `;
      }
      return;
    }

    const totalViews = data.reduce((sum, p) => sum + (p.views || 0), 0);

    const el = $("totalViews");
    if (el) el.textContent = totalViews.toLocaleString("en-IN");

    const detailEl = $("pageViewsDetail");
    if (detailEl) {
      detailEl.innerHTML = data.map(page => `
        <div style="
          display:flex;
          justify-content:space-between;
          padding:10px 14px;
          border-bottom:1px solid #e8efec;
          font-size:13px;
        ">
          <span style="color:#3c4944;font-weight:600;">
            ${escapeHTML(page.page_title || page.page_slug)}
          </span>
          <span style="color:#176b52;font-weight:700;">
            ${(page.views || 0).toLocaleString("en-IN")} views
          </span>
        </div>
      `).join("");
    }

    console.log("✓ Page views loaded:", totalViews);
  } catch (err) {
    console.error("Page views exception:", err);
  }
}


/* =========================================================
   1. HOMEPAGE HERO
========================================================= */

async function loadHomepage() {
  try {
    const { data, error } = await supabaseClient
      .from("homepage_content")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) return;

    if ($("heroTitle")) $("heroTitle").value = data.title || "";
    if ($("heroSubtitle")) $("heroSubtitle").value = data.subtitle || "";
    if ($("heroDescription")) $("heroDescription").value = data.description || "";
    if ($("heroButton")) $("heroButton").value = data.button_text || "";
    if ($("heroButtonLink")) $("heroButtonLink").value = data.button_link || "";
    if ($("heroImage")) $("heroImage").value = data.image_url || "";

    showImagePreview("heroImagePreview", data.image_url);
  } catch (e) {
    console.error("Homepage error:", e);
  }
}

function setupHomepage() {
  const form = $("heroForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      title: $("heroTitle")?.value.trim() || "",
      subtitle: $("heroSubtitle")?.value.trim() || "",
      description: $("heroDescription")?.value.trim() || "",
      button_text: $("heroButton")?.value.trim() || "",
      button_link: $("heroButtonLink")?.value.trim() || "",
      image_url: $("heroImage")?.value.trim() || "",
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabaseClient
      .from("homepage_content").select("id").limit(1).maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabaseClient.from("homepage_content").update(payload).eq("id", existing.id);
    } else {
      result = await supabaseClient.from("homepage_content").insert(payload);
    }

    if (result.error) {
      setMessage("heroMessage", "Save error: " + result.error.message, false);
    } else {
      setMessage("heroMessage", "✓ Homepage saved.");
    }
  });

  $("heroUploadBtn")?.addEventListener("click", async () => {
    const file = $("heroImageFile")?.files?.[0];
    if (!file) return setMessage("imageUploadMessage", "पहले image select करें।", false);

    const url = await uploadImage(file, "hero");
    if (url) {
      $("heroImage").value = url;
      showImagePreview("heroImagePreview", url);
      setMessage("imageUploadMessage", "✓ Image uploaded.");
    }
  });
}


/* =========================================================
   2. STATS
========================================================= */

async function loadStats() {
  try {
    const { data } = await supabaseClient
      .from("homepage_stats").select("*").limit(1).maybeSingle();

    if (!data) return;

    if ($("statOrders")) $("statOrders").value = data.stat_orders || "";
    if ($("statRating")) $("statRating").value = data.stat_rating || "";
    if ($("statTime")) $("statTime").value = data.stat_time || "";
  } catch (e) { console.error(e); }
}

function setupStats() {
  const form = $("statsForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      stat_orders: $("statOrders")?.value.trim() || "",
      stat_rating: $("statRating")?.value.trim() || "",
      stat_time: $("statTime")?.value.trim() || "",
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabaseClient
      .from("homepage_stats").select("id").limit(1).maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabaseClient.from("homepage_stats").update(payload).eq("id", existing.id);
    } else {
      result = await supabaseClient.from("homepage_stats").insert(payload);
    }

    if (result.error) {
      setMessage("statsMessage", result.error.message, false);
    } else {
      setMessage("statsMessage", "✓ Stats saved.");
    }
  });
}

/* =========================================================
   BASANTA DRY CLEANLINESS
   CONTENT ADMIN JS — PART 3/6
========================================================= */


/* =========================================================
   3. SERVICES
========================================================= */

async function loadServices() {
  const list = $("servicesList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("services").select("*").order("sort_order", { ascending: true });

  if (error) {
    list.innerHTML = `<p style="color:red">Services load error: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p>कोई service नहीं है।</p>`;
    return;
  }

  list.innerHTML = data.map(service => `
    <div class="service-admin-card" data-id="${service.id}">
      <div class="service-admin-image">
        ${service.image_url
          ? `<img src="${escapeHTML(service.image_url)}" alt="${escapeHTML(service.name)}">`
          : `<span>${escapeHTML(service.icon || "🧺")}</span>`}
      </div>
      <div class="service-admin-info">
        <h3>${escapeHTML(service.name)}</h3>
        <p>${escapeHTML(service.description || "")}</p>
        <strong>₹${escapeHTML(service.price ?? 0)}</strong>
        <small>${service.active ? "● Active" : "● Inactive"}</small>
        <small>Order: ${escapeHTML(service.sort_order ?? 0)}</small>
      </div>
      <div class="service-admin-actions">
        <button type="button" onclick="editService('${service.id}')">✏️ Edit</button>
        <button type="button" onclick="toggleService('${service.id}', ${service.active})">
          ${service.active ? "⏸ Disable" : "▶ Enable"}
        </button>
        <button type="button" onclick="deleteService('${service.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join("");
}

function setupServices() {
  $("newServiceBtn")?.addEventListener("click", newService);
  $("serviceForm")?.addEventListener("submit", saveService);
  $("cancelServiceBtn")?.addEventListener("click", closeServiceEditor);
  $("closeServiceEditorBtn")?.addEventListener("click", closeServiceEditor);
}

function newService() {
  if (!$("serviceEditor")) return;
  $("serviceEditor").hidden = false;
  $("serviceEditorTitle").textContent = "New Service";
  $("serviceId").value = "";
  $("serviceName").value = "";
  $("serviceDescription").value = "";
  $("servicePrice").value = "";
  $("serviceIcon").value = "🧺";
  $("serviceImage").value = "";
  $("serviceActive").checked = true;
  $("serviceSortOrder").value = "0";
  showImagePreview("serviceImagePreview", "");
  $("serviceEditor").scrollIntoView({ behavior: "smooth" });
}

async function editService(id) {
  const { data, error } = await supabaseClient
    .from("services").select("*").eq("id", id).single();

  if (error) return alert("Load failed: " + error.message);

  $("serviceEditor").hidden = false;
  $("serviceEditorTitle").textContent = "Edit Service";
  $("serviceId").value = data.id || "";
  $("serviceName").value = data.name || "";
  $("serviceDescription").value = data.description || "";
  $("servicePrice").value = data.price ?? "";
  $("serviceIcon").value = data.icon || "🧺";
  $("serviceImage").value = data.image_url || "";
  $("serviceActive").checked = data.active !== false;
  $("serviceSortOrder").value = data.sort_order ?? 0;
  showImagePreview("serviceImagePreview", data.image_url);
  $("serviceEditor").scrollIntoView({ behavior: "smooth" });
}

async function saveService(e) {
  e.preventDefault();

  const id = $("serviceId")?.value.trim();

  const payload = {
    name: $("serviceName")?.value.trim() || "",
    description: $("serviceDescription")?.value.trim() || "",
    price: Number($("servicePrice")?.value || 0),
    icon: $("serviceIcon")?.value.trim() || "🧺",
    image_url: $("serviceImage")?.value.trim() || "",
    active: $("serviceActive")?.checked ?? true,
    sort_order: Number($("serviceSortOrder")?.value || 0)
  };

  if (!payload.name) return setMessage("serviceMessage", "Name required.", false);

  let result;
  if (id) {
    result = await supabaseClient.from("services").update(payload).eq("id", id);
  } else {
    result = await supabaseClient.from("services").insert(payload);
  }

  if (result.error) {
    setMessage("serviceMessage", "Save error: " + result.error.message, false);
  } else {
    setMessage("serviceMessage", "✓ Service saved.");
    await loadServices();
    setTimeout(closeServiceEditor, 500);
  }
}

async function toggleService(id, currentStatus) {
  const { error } = await supabaseClient
    .from("services").update({ active: !currentStatus }).eq("id", id);

  if (error) return alert("Update failed: " + error.message);
  await loadServices();
}

async function deleteService(id) {
  if (!confirm("Service delete करें?")) return;

  const { error } = await supabaseClient.from("services").delete().eq("id", id);
  if (error) return alert("Delete failed: " + error.message);
  await loadServices();
}

function closeServiceEditor() {
  if ($("serviceEditor")) $("serviceEditor").hidden = true;
}

/* =========================================================
   BASANTA DRY CLEANLINESS
   CONTENT ADMIN JS — PART 4/6
========================================================= */


/* =========================================================
   4. ARTICLES
========================================================= */

async function loadArticles() {
  const list = $("articlesList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("articles").select("*").order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<p>Articles load नहीं हो सके।</p>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p>No articles found.</p>`;
    return;
  }

  list.innerHTML = data.map(article => `
    <div class="article-admin-card">
      <div>
        <h3>${escapeHTML(article.title)}</h3>
        <p>${escapeHTML(article.category || "")}</p>
        <small>${article.published ? "Published" : "Draft"}</small>
      </div>
      <div>
        <button type="button" onclick="editArticle('${article.id}')">Edit</button>
        <button type="button" onclick="deleteArticle('${article.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function setupArticles() {
  $("newArticleBtn")?.addEventListener("click", newArticle);
  $("closeEditorBtn")?.addEventListener("click", closeArticleEditor);
  $("cancelArticleBtn")?.addEventListener("click", closeArticleEditor);
  $("articleForm")?.addEventListener("submit", saveArticle);

  $("articleUploadBtn")?.addEventListener("click", async () => {
    const file = $("articleImageFile")?.files?.[0];
    if (!file) return alert("पहले article image select करें।");

    const url = await uploadImage(file, "articles");
    if (url) {
      $("articleImage").value = url;
      showImagePreview("articleImagePreview", url);
    }
  });
}

function newArticle() {
  $("articleEditor").hidden = false;
  $("editorTitle").textContent = "New Article";
  $("articleId").value = "";
  $("articleTitle").value = "";
  $("articleSlug").value = "";
  $("articleCategory").value = "";
  $("articleDescription").value = "";
  $("articleImage").value = "";
  $("articleContent").value = "";
  $("articleAuthor").value = "Basanta";
  $("articlePublished").checked = true;
  showImagePreview("articleImagePreview", "");
}

async function editArticle(id) {
  const { data, error } = await supabaseClient
    .from("articles").select("*").eq("id", id).single();

  if (error) return alert(error.message);

  $("articleEditor").hidden = false;
  $("editorTitle").textContent = "Edit Article";
  $("articleId").value = data.id || "";
  $("articleTitle").value = data.title || "";
  $("articleSlug").value = data.slug || "";
  $("articleCategory").value = data.category || "";
  $("articleDescription").value = data.description || "";
  $("articleImage").value = data.image_url || "";
  $("articleContent").value = data.content || "";
  $("articleAuthor").value = data.author || "Basanta";
  $("articlePublished").checked = data.published !== false;
  showImagePreview("articleImagePreview", data.image_url);

  window.scrollTo({ top: $("articleEditor").offsetTop - 20, behavior: "smooth" });
}

async function saveArticle(e) {
  e.preventDefault();

  const id = $("articleId").value.trim();

  const payload = {
    title: $("articleTitle").value.trim(),
    slug: $("articleSlug").value.trim(),
    category: $("articleCategory").value.trim(),
    description: $("articleDescription").value.trim(),
    image_url: $("articleImage").value.trim(),
    content: $("articleContent").value.trim(),
    author: $("articleAuthor").value.trim() || "Basanta",
    published: $("articlePublished").checked
  };

  let result;
  if (id) {
    result = await supabaseClient.from("articles").update(payload).eq("id", id);
  } else {
    result = await supabaseClient.from("articles").insert(payload);
  }

  if (result.error) {
    return setMessage("articleMessage", result.error.message, false);
  }

  setMessage("articleMessage", "✓ Article saved.");
  await loadArticles();
  setTimeout(closeArticleEditor, 500);
}

async function deleteArticle(id) {
  if (!confirm("Article delete करें?")) return;

  const { error } = await supabaseClient.from("articles").delete().eq("id", id);
  if (error) return alert("Delete failed: " + error.message);
  await loadArticles();
}

function closeArticleEditor() {
  if ($("articleEditor")) $("articleEditor").hidden = true;
}

/* =========================================================
   BASANTA DRY CLEANLINESS
   CONTENT ADMIN JS — PART 5/6
========================================================= */


/* =========================================================
   5. PRICING
========================================================= */

async function loadPrices() {
  const list = $("pricesList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("pricing").select("*").order("sort_order", { ascending: true });

  if (error) {
    list.innerHTML = `<p style="color:red">Prices load error: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p>कोई price नहीं है।</p>`;
    return;
  }

  list.innerHTML = data.map(price => `
    <div class="service-admin-card" data-id="${price.id}">
      <div class="service-admin-image">
        <span>${escapeHTML(price.icon || "👔")}</span>
      </div>
      <div class="service-admin-info">
        <h3>${escapeHTML(price.name)}</h3>
        <p>${escapeHTML(price.description || "")}</p>
        <strong>₹${escapeHTML(price.price ?? 0)}</strong>
        <small>${price.active ? "● Active" : "● Inactive"}</small>
        <small>Order: ${escapeHTML(price.sort_order ?? 0)}</small>
      </div>
      <div class="service-admin-actions">
        <button type="button" onclick="editPrice('${price.id}')">✏️ Edit</button>
        <button type="button" onclick="togglePrice('${price.id}', ${price.active})">
          ${price.active ? "⏸ Disable" : "▶ Enable"}
        </button>
        <button type="button" onclick="deletePrice('${price.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join("");
}

function setupPrices() {
  $("newPriceBtn")?.addEventListener("click", newPrice);
  $("priceForm")?.addEventListener("submit", savePrice);
  $("cancelPriceBtn")?.addEventListener("click", closePriceEditor);
  $("closePriceEditorBtn")?.addEventListener("click", closePriceEditor);
}

function newPrice() {
  $("priceEditor").hidden = false;
  $("priceEditorTitle").textContent = "Add Price";
  $("priceId").value = "";
  $("priceName").value = "";
  $("priceDescription").value = "";
  $("priceAmount").value = "";
  $("priceIcon").value = "👔";
  $("priceActive").checked = true;
  $("priceSortOrder").value = "0";
  $("priceEditor").scrollIntoView({ behavior: "smooth" });
}

async function editPrice(id) {
  const { data, error } = await supabaseClient
    .from("pricing").select("*").eq("id", id).single();

  if (error) return alert(error.message);

  $("priceEditor").hidden = false;
  $("priceEditorTitle").textContent = "Edit Price";
  $("priceId").value = data.id || "";
  $("priceName").value = data.name || "";
  $("priceDescription").value = data.description || "";
  $("priceAmount").value = data.price ?? "";
  $("priceIcon").value = data.icon || "👔";
  $("priceActive").checked = data.active !== false;
  $("priceSortOrder").value = data.sort_order ?? 0;
  $("priceEditor").scrollIntoView({ behavior: "smooth" });
}

async function savePrice(e) {
  e.preventDefault();

  const id = $("priceId").value.trim();

  const payload = {
    name: $("priceName").value.trim(),
    description: $("priceDescription").value.trim(),
    price: Number($("priceAmount").value || 0),
    icon: $("priceIcon").value.trim() || "👔",
    active: $("priceActive").checked,
    sort_order: Number($("priceSortOrder").value || 0)
  };

  if (!payload.name) return setMessage("priceMessage", "Name required.", false);

  let result;
  if (id) {
    result = await supabaseClient.from("pricing").update(payload).eq("id", id);
  } else {
    result = await supabaseClient.from("pricing").insert(payload);
  }

  if (result.error) {
    setMessage("priceMessage", result.error.message, false);
  } else {
    setMessage("priceMessage", "✓ Price saved.");
    await loadPrices();
    setTimeout(closePriceEditor, 500);
  }
}

async function togglePrice(id, currentStatus) {
  const { error } = await supabaseClient
    .from("pricing").update({ active: !currentStatus }).eq("id", id);

  if (error) return alert(error.message);
  await loadPrices();
}

async function deletePrice(id) {
  if (!confirm("Price delete करें?")) return;
  const { error } = await supabaseClient.from("pricing").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadPrices();
}

function closePriceEditor() {
  if ($("priceEditor")) $("priceEditor").hidden = true;
}


/* =========================================================
   6. STEPS
========================================================= */

async function loadSteps() {
  const list = $("stepsList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("steps").select("*").order("sort_order", { ascending: true });

  if (error) {
    list.innerHTML = `<p style="color:red">Steps load error: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p>कोई step नहीं है।</p>`;
    return;
  }

  list.innerHTML = data.map(step => `
    <div class="service-admin-card" data-id="${step.id}">
      <div class="service-admin-image">
        <span>${escapeHTML(step.icon || "📦")}</span>
      </div>
      <div class="service-admin-info">
        <h3>${escapeHTML(step.step_number || "")} ${escapeHTML(step.title)}</h3>
        <p>${escapeHTML(step.description || "")}</p>
        <small>${step.active ? "● Active" : "● Inactive"}</small>
        <small>Order: ${escapeHTML(step.sort_order ?? 0)}</small>
      </div>
      <div class="service-admin-actions">
        <button type="button" onclick="editStep('${step.id}')">✏️ Edit</button>
        <button type="button" onclick="deleteStep('${step.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join("");
}

function setupSteps() {
  $("newStepBtn")?.addEventListener("click", newStep);
  $("stepForm")?.addEventListener("submit", saveStep);
  $("cancelStepBtn")?.addEventListener("click", closeStepEditor);
  $("closeStepEditorBtn")?.addEventListener("click", closeStepEditor);
}

function newStep() {
  $("stepEditor").hidden = false;
  $("stepEditorTitle").textContent = "Add Step";
  $("stepId").value = "";
  $("stepNumber").value = "";
  $("stepIcon").value = "📦";
  $("stepTitle").value = "";
  $("stepDescription").value = "";
  $("stepActive").checked = true;
  $("stepSortOrder").value = "0";
  $("stepEditor").scrollIntoView({ behavior: "smooth" });
}

async function editStep(id) {
  const { data, error } = await supabaseClient
    .from("steps").select("*").eq("id", id).single();

  if (error) return alert(error.message);

  $("stepEditor").hidden = false;
  $("stepEditorTitle").textContent = "Edit Step";
  $("stepId").value = data.id || "";
  $("stepNumber").value = data.step_number || "";
  $("stepIcon").value = data.icon || "📦";
  $("stepTitle").value = data.title || "";
  $("stepDescription").value = data.description || "";
  $("stepActive").checked = data.active !== false;
  $("stepSortOrder").value = data.sort_order ?? 0;
  $("stepEditor").scrollIntoView({ behavior: "smooth" });
}

async function saveStep(e) {
  e.preventDefault();

  const id = $("stepId").value.trim();

  const payload = {
    step_number: $("stepNumber").value.trim(),
    icon: $("stepIcon").value.trim() || "📦",
    title: $("stepTitle").value.trim(),
    description: $("stepDescription").value.trim(),
    active: $("stepActive").checked,
    sort_order: Number($("stepSortOrder").value || 0)
  };

  if (!payload.title) return setMessage("stepMessage", "Title required.", false);

  let result;
  if (id) {
    result = await supabaseClient.from("steps").update(payload).eq("id", id);
  } else {
    result = await supabaseClient.from("steps").insert(payload);
  }

  if (result.error) {
    setMessage("stepMessage", result.error.message, false);
  } else {
    setMessage("stepMessage", "✓ Step saved.");
    await loadSteps();
    setTimeout(closeStepEditor, 500);
  }
}

async function deleteStep(id) {
  if (!confirm("Step delete करें?")) return;
  const { error } = await supabaseClient.from("steps").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadSteps();
}

function closeStepEditor() {
  if ($("stepEditor")) $("stepEditor").hidden = true;
}


/* =========================================================
   7. CONTACT
========================================================= */

async function loadContact() {
  const { data, error } = await supabaseClient
    .from("contact_information").select("*").limit(1).maybeSingle();

  if (error || !data) return;

  if ($("contactPhone")) $("contactPhone").value = data.phone || "";
  if ($("contactWhatsapp")) $("contactWhatsapp").value = data.whatsapp || "";
  if ($("contactEmail")) $("contactEmail").value = data.email || "";
  if ($("contactAddress")) $("contactAddress").value = data.address || "";
  if ($("contactInstagram")) $("contactInstagram").value = data.instagram || "";
  if ($("contactFacebook")) $("contactFacebook").value = data.facebook || "";
}

function setupContact() {
  $("contactForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      phone: $("contactPhone")?.value.trim() || "",
      whatsapp: $("contactWhatsapp")?.value.trim() || "",
      email: $("contactEmail")?.value.trim() || "",
      address: $("contactAddress")?.value.trim() || "",
      instagram: $("contactInstagram")?.value.trim() || "",
      facebook: $("contactFacebook")?.value.trim() || "",
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabaseClient
      .from("contact_information").select("id").limit(1).maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabaseClient.from("contact_information").update(payload).eq("id", existing.id);
    } else {
      result = await supabaseClient.from("contact_information").insert(payload);
    }

    if (result.error) {
      setMessage("contactMessage", result.error.message, false);
    } else {
      setMessage("contactMessage", "✓ Contact saved.");
    }
  });
}

/* =========================================================
   BASANTA DRY CLEANLINESS
   CONTENT ADMIN JS — PART 6/6 (LAST)
========================================================= */


/* =========================================================
   8. FOOTER LINKS
========================================================= */

async function loadFooterLinks() {
  const list = $("footerLinksList");
  if (!list) return;

  list.innerHTML = `<div class="loading">Footer links loading...</div>`;

  const { data, error } = await supabaseClient
    .from("footer_links")
    .select("*")
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    list.innerHTML = `<div class="loading">Error: ${escapeHTML(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="loading">कोई footer link नहीं है।</div>`;
    return;
  }

  list.innerHTML = data.map(link => `
    <div class="admin-item">
      <div>
        <strong>${escapeHTML(link.title)}</strong>
        <small>${escapeHTML(link.section)} • ${escapeHTML(link.url)}</small>
      </div>
      <div class="admin-item-actions">
        <button type="button" class="edit-btn" onclick="editFooterLink('${link.id}')">Edit</button>
        <button type="button" class="delete-btn" onclick="deleteFooterLink('${link.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function setupFooterLinks() {
  $("newFooterLinkBtn")?.addEventListener("click", openFooterEditor);
  $("closeFooterLinkEditorBtn")?.addEventListener("click", closeFooterEditor);
  $("cancelFooterLinkBtn")?.addEventListener("click", closeFooterEditor);

  $("footerLinkForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = $("footerLinkId").value.trim();

    const payload = {
      section: $("footerLinkSection").value.trim(),
      title: $("footerLinkName").value.trim(),
      url: $("footerLinkUrl").value.trim(),
      active: $("footerLinkActive").checked,
      sort_order: Number($("footerLinkSortOrder").value || 0),
      updated_at: new Date().toISOString()
    };

    if (!payload.title) return setMessage("footerLinkMessage", "Link name डालें।", false);
    if (!payload.url) return setMessage("footerLinkMessage", "Link URL डालें।", false);

    let result;
    if (id) {
      result = await supabaseClient.from("footer_links").update(payload).eq("id", id);
    } else {
      result = await supabaseClient.from("footer_links").insert(payload);
    }

    if (result.error) {
      setMessage("footerLinkMessage", "Error: " + result.error.message, false);
    } else {
      setMessage("footerLinkMessage", "✓ Footer link saved.");
      await loadFooterLinks();
      setTimeout(closeFooterEditor, 500);
    }
  });
}

function openFooterEditor() {
  if (!$("footerLinkEditor")) return;

  $("footerLinkEditorTitle").textContent = "Add Footer Link";
  $("footerLinkId").value = "";
  $("footerLinkSection").value = "Services";
  $("footerLinkName").value = "";
  $("footerLinkUrl").value = "";
  $("footerLinkSortOrder").value = "0";
  $("footerLinkActive").checked = true;
  $("footerLinkMessage").textContent = "";
  $("footerLinkEditor").hidden = false;
  $("footerLinkEditor").scrollIntoView({ behavior: "smooth" });
}

function closeFooterEditor() {
  if ($("footerLinkEditor")) $("footerLinkEditor").hidden = true;
}

async function editFooterLink(id) {
  const { data, error } = await supabaseClient
    .from("footer_links").select("*").eq("id", id).single();

  if (error) return alert(error.message);

  $("footerLinkEditorTitle").textContent = "Edit Footer Link";
  $("footerLinkId").value = data.id;
  $("footerLinkSection").value = data.section || "Company";
  $("footerLinkName").value = data.title || "";
  $("footerLinkUrl").value = data.url || "";
  $("footerLinkSortOrder").value = data.sort_order ?? 0;
  $("footerLinkActive").checked = data.active !== false;
  $("footerLinkMessage").textContent = "";
  $("footerLinkEditor").hidden = false;
  $("footerLinkEditor").scrollIntoView({ behavior: "smooth" });
}

async function deleteFooterLink(id) {
  if (!confirm("Footer link delete करें?")) return;

  const { error } = await supabaseClient.from("footer_links").delete().eq("id", id);
  if (error) return alert("Delete failed: " + error.message);

  await loadFooterLinks();
}


/* =========================================================
   9. REVIEWS
========================================================= */

async function loadReviews() {
  const list = $("reviewsList");
  if (!list) return;

  list.innerHTML = `<div class="loading">Reviews loading...</div>`;

  const { data, error } = await supabaseClient
    .from("reviews").select("*").order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<div class="loading">Error: ${escapeHTML(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="loading">कोई review नहीं है।</div>`;
    return;
  }

  const filter = $("reviewFilter")?.value || "all";
  let filtered = data;

  if (filter === "pending") filtered = data.filter(r => !r.approved);
  if (filter === "approved") filtered = data.filter(r => r.approved);

  if (filtered.length === 0) {
    list.innerHTML = `<div class="loading">कोई review नहीं मिला।</div>`;
    return;
  }

  list.innerHTML = filtered.map(review => `
    <div class="service-admin-card">
      <div class="service-admin-image">
        <span>${"★".repeat(review.rating || 5)}</span>
      </div>
      <div class="service-admin-info">
        <h3>${escapeHTML(review.customer_name || "Customer")}</h3>
        <p>${escapeHTML(review.comment || "")}</p>
        <small>${review.approved ? "● Approved" : "● Pending"}</small>
        <small>${new Date(review.created_at).toLocaleDateString("en-IN")}</small>
      </div>
      <div class="service-admin-actions">
        <button type="button" onclick="toggleReview('${review.id}', ${review.approved})">
          ${review.approved ? "⏸ Unapprove" : "✓ Approve"}
        </button>
        <button type="button" onclick="deleteReview('${review.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join("");
}

function setupReviews() {
  $("reviewFilter")?.addEventListener("change", loadReviews);
}

async function toggleReview(id, currentStatus) {
  const { error } = await supabaseClient
    .from("reviews").update({ approved: !currentStatus }).eq("id", id);

  if (error) return alert(error.message);
  await loadReviews();
}

async function deleteReview(id) {
  if (!confirm("Review delete करें?")) return;

  const { error } = await supabaseClient.from("reviews").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadReviews();
}


/* =========================================================
   GLOBAL FUNCTIONS (for onclick)
========================================================= */

function attachGlobalFunctions() {
  // Articles
  window.editArticle = editArticle;
  window.deleteArticle = deleteArticle;

  // Services
  window.editService = editService;
  window.deleteService = deleteService;
  window.toggleService = toggleService;

  // Prices
  window.editPrice = editPrice;
  window.deletePrice = deletePrice;
  window.togglePrice = togglePrice;

  // Steps
  window.editStep = editStep;
  window.deleteStep = deleteStep;

  // Footer Links
  window.editFooterLink = editFooterLink;
  window.deleteFooterLink = deleteFooterLink;

  // Reviews
  window.toggleReview = toggleReview;
  window.deleteReview = deleteReview;
}

console.log("Basanta Content Admin JS ready.");