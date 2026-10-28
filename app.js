/* =====================================================
   BASANTA DRY CLEANLINESS - FINAL
   Demo reviews mode ON (real load बंद)
===================================================== */

const SUPABASE_URL = "https://ubsyhqkefhtskxjpjzbf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hCW9e5LLUWNnQaKDxCP5eg_1tUpo5Tr";
const CLOTH_IMAGE_BUCKET = "cloth-images";
const WHATSAPP_NUMBER = "9569553540";

/* 🔴 DEMO MODE: true = सिर्फ HTML के hardcoded demo reviews दिखेंगे, form भी बंद
   बाद में real reviews चालू करने के लिए इसे false कर दें */
const DEMO_REVIEWS_MODE = true;

let supabaseClient = null;
let serviceGrid, bookingModal, bookingForm, bookingMessage;
let selectedClothImages = [];

function escapeHTML(value) {
  return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
function escapeCSSURL(value) {
  return String(value ?? "").replace(/\\/g,"\\\\").replace(/"/g,'\\"');
}
function formatPrice(price) {
  const n = Number(price);
  return Number.isNaN(n) ? "0" : n.toLocaleString("en-IN");
}
function formatArticleDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}
function initSupabase() {
  try {
    if (typeof window.supabase === "undefined") return null;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) { return null; }
}

document.addEventListener("DOMContentLoaded", function () {
  serviceGrid = document.getElementById("serviceGrid");
  bookingModal = document.getElementById("bookingModal");
  bookingForm = document.getElementById("bookingForm");
  bookingMessage = document.getElementById("bookingMessage");
  supabaseClient = initSupabase();
  trackPageView("homepage");
  setupMobileMenu();
  setupButtons();
  setupModal();
  setMinimumDate();
  setupClothImagePreviews();
  setupReviewForm();
  setupStarRating();
  loadServices();
  loadHomepageContent();
  loadHomepageStats();
  loadPricing();
  loadSteps();
  loadContactInformation();
  loadArticles();
  loadFooterLinks();
  loadReviews();
});

async function trackPageView(pageName) {
  if (!supabaseClient) return;
  try { await supabaseClient.rpc("increment_page_view", { page_name: pageName }); } catch (e) {}
}

function setupMobileMenu() {
  const btn = document.getElementById("mobileMenuBtn");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    btn.classList.toggle("is-open");
    menu.classList.toggle("show");
    document.body.classList.toggle("mobile-menu-open");
    btn.setAttribute("aria-expanded", String(menu.classList.contains("show")));
  });
  menu.querySelectorAll("a, button").forEach((link) => {
    link.addEventListener("click", () => {
      btn.classList.remove("is-open");
      menu.classList.remove("show");
      document.body.classList.remove("mobile-menu-open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

function setupButtons() {
  ["bookTopBtn","bookHeroBtn","quickPickupBtn","bookCtaBtn","mobileBookBtn"].forEach(function (id) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", openBookingModal);
  });
  const allServicesBtn = document.getElementById("allServicesBtn");
  if (allServicesBtn) allServicesBtn.addEventListener("click", () => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }));
}

function setupModal() {
  const closeBtn = document.getElementById("closeModal");
  const overlay = document.querySelector(".modal-overlay");
  if (closeBtn) closeBtn.addEventListener("click", closeBookingModal);
  if (overlay) overlay.addEventListener("click", closeBookingModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && bookingModal?.classList.contains("show")) closeBookingModal();
  });
  if (bookingForm) bookingForm.addEventListener("submit", submitBooking);
}

function openBookingModal() {
  if (!bookingModal) return;
  bookingModal.classList.add("show");
  bookingModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeBookingModal() {
  if (!bookingModal) return;
  bookingModal.classList.remove("show");
  bookingModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (bookingMessage) bookingMessage.textContent = "";
}
function setMinimumDate() {
  const input = document.getElementById("pickupDate");
  if (!input) return;
  const t = new Date();
  input.min = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
}

async function loadServices() {
  if (!serviceGrid) return;
  if (!supabaseClient) { serviceGrid.innerHTML = `<div class="service-loading">Services uplabdh nahi.</div>`; return; }
  try {
    const { data, error } = await supabaseClient.from("services").select("*").eq("active", true).order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) { serviceGrid.innerHTML = `<div class="service-loading">Koi service nahi.</div>`; return; }
    serviceGrid.innerHTML = "";
    data.forEach((service) => {
      const card = document.createElement("article");
      card.className = "service-card";
      const img = service.image_url ? `<img class="service-image" src="${escapeHTML(service.image_url)}" alt="${escapeHTML(service.name||"")}" loading="lazy">` : `<div class="service-icon">${escapeHTML(service.icon||"🧺")}</div>`;
      card.innerHTML = `${img}<h3>${escapeHTML(service.name||"Service")}</h3><p>${escapeHTML(service.description||"")}</p><span class="service-price">From ₹${formatPrice(service.price)}</span>`;
      serviceGrid.appendChild(card);
    });
  } catch (e) {}
}

async function loadHomepageContent() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from("homepage_content").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !data) return;
    const title = document.getElementById("heroTitle");
    if (title) title.innerHTML = `${escapeHTML(data.title || "Fresh Clothes.")}<span>${escapeHTML(data.subtitle || "Fresh Confidence.")}</span>`;
    const badge = document.querySelector(".hero-content .badge");
    if (badge && data.badge) badge.textContent = data.badge;
    const desc = document.getElementById("heroDescription");
    if (desc && data.description !== undefined) desc.textContent = data.description || "";
    const heroButton = document.getElementById("bookHeroBtn");
    if (heroButton && data.button_text) {
      const btnText = document.getElementById("heroButtonText");
      if (btnText) btnText.textContent = data.button_text;
    }
    if (heroButton && data.button_link) {
      heroButton.onclick = function () {
        const link = String(data.button_link).trim();
        if (!link || link === "#booking") return openBookingModal();
        if (link.startsWith("#")) document.querySelector(link)?.scrollIntoView({behavior:"smooth"});
        else window.location.href = link;
      };
    }
    if (data.image_url) {
      const image = document.getElementById("heroImage");
      if (image) { image.style.backgroundImage = `url("${escapeCSSURL(data.image_url)}")`; image.style.backgroundSize = "cover"; image.style.backgroundPosition = "center"; }
    }
  } catch (e) {}
}

async function loadHomepageStats() {
  if (!supabaseClient) return;
  try {
    const { data } = await supabaseClient.from("homepage_stats").select("*").order("updated_at", {ascending:false}).limit(1).maybeSingle();
    if (!data) return;
    const orders = document.getElementById("statOrders");
    const rating = document.getElementById("statRating");
    const time = document.getElementById("statTime");
    if (orders && data.stat_orders !== undefined) orders.textContent = data.stat_orders;
    if (rating && data.stat_rating !== undefined) rating.textContent = data.stat_rating;
    if (time && data.stat_time !== undefined) time.textContent = data.stat_time;
  } catch (e) {}
}

async function loadPricing() {
  const grid = document.getElementById("priceGrid");
  if (!grid || !supabaseClient) return;
  try {
    const { data } = await supabaseClient.from("pricing").select("*").eq("active", true).order("sort_order", {ascending:true});
    if (!data || !data.length) return;
    grid.innerHTML = data.map(p => `<div class="price-card"><div class="clothing-icon">${escapeHTML(p.icon || "👔")}</div><div><h3>${escapeHTML(p.name || p.clothing_name || "Clothing")}</h3><span>${escapeHTML(p.description || "")}</span></div><strong>₹${formatPrice(p.price ?? p.amount ?? 0)}</strong></div>`).join("");
  } catch (e) {}
}

async function loadSteps() {
  const grid = document.querySelector(".steps-grid");
  if (!grid || !supabaseClient) return;
  try {
    const { data } = await supabaseClient.from("steps").select("*").eq("active", true).order("sort_order", {ascending:true});
    if (!data || !data.length) return;
    grid.innerHTML = data.map((step,i) => `<div class="step-card"><span class="step-number">${escapeHTML(step.step_number || String(i+1).padStart(2,"0"))}</span><div class="step-icon">${escapeHTML(step.icon || "📦")}</div><h3>${escapeHTML(step.title || "Step")}</h3><p>${escapeHTML(step.description || "")}</p></div>`).join("");
  } catch (e) {}
}

async function loadContactInformation() {
  if (!supabaseClient) return;
  try {
    const { data } = await supabaseClient.from("contact_information").select("*").limit(1).maybeSingle();
    if (!data) return;
    const phone = document.getElementById("contactPhone");
    const phoneLink = document.getElementById("contactPhoneLink");
    if (phone) phone.textContent = data.phone || "Not available";
    if (phoneLink && data.phone) phoneLink.href = "tel:" + String(data.phone).replace(/[^0-9+]/g, "");
    const wa = document.getElementById("contactWhatsapp");
    const waLink = document.getElementById("contactWhatsappLink");
    if (wa) wa.textContent = data.whatsapp || "Not available";
    if (waLink && data.whatsapp) waLink.href = "https://wa.me/" + String(data.whatsapp).replace(/[^0-9]/g, "");
    const em = document.getElementById("contactEmail");
    const emLink = document.getElementById("contactEmailLink");
    if (em) em.textContent = data.email || "Not available";
    if (emLink && data.email) emLink.href = "mailto:" + data.email;
    const addr = document.getElementById("contactAddress");
    if (addr) addr.textContent = data.address || "Lanka, Sigra, Bhelupur, BHU - Full Varanasi";
    const ig = document.getElementById("contactInstagramLink");
    if (ig) ig.href = data.instagram || "#";
    const fb = document.getElementById("contactFacebookLink");
    if (fb) fb.href = data.facebook || "#";
  } catch (e) {}
}

async function loadArticles() {
  const grid = document.getElementById("articleGrid");
  if (!grid) return;
  if (!supabaseClient) { grid.innerHTML = `<p class="empty-state">Articles uplabdh nahi.</p>`; return; }
  try {
    const { data } = await supabaseClient.from("articles").select("*").eq("published", true).order("created_at", { ascending: false });
    if (!data || data.length === 0) { grid.innerHTML = `<p class="empty-state">Koi article nahi.</p>`; return; }
    grid.innerHTML = "";
    data.forEach((a) => {
      const card = document.createElement("article");
      card.className = "article-card";
      const img = a.image_url ? `<img src="${escapeHTML(a.image_url)}" alt="${escapeHTML(a.title||"")}" loading="lazy">` : `<div class="article-image-placeholder">📰</div>`;
      const rawDesc = a.description || a.content || "";
      const plainDesc = String(rawDesc).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const short = plainDesc.length > 150 ? plainDesc.substring(0,150)+"..." : plainDesc;
      card.innerHTML = `<div class="article-image">${img}</div><div class="article-content">${a.category? `<span class="article-category">${escapeHTML(a.category)}</span>` : ""}<h3>${escapeHTML(a.title||"Untitled")}</h3><p>${escapeHTML(short)}</p><div class="article-meta"><span>${escapeHTML(a.author||"Basanta")}</span><span>${formatArticleDate(a.created_at)}</span></div><button type="button" class="article-read-btn" data-id="${escapeHTML(String(a.id))}">Read More →</button></div>`;
      grid.appendChild(card);
    });
    document.querySelectorAll(".article-read-btn").forEach((b) => {
      b.addEventListener("click", () => { window.location.href = `article.html?id=${encodeURIComponent(b.dataset.id)}`; });
    });
  } catch (e) {}
}

async function loadFooterLinks() {
  const cols = document.querySelectorAll(".footer-column");
  if (!cols.length || !supabaseClient) return;
  try {
    const { data } = await supabaseClient.from("footer_links").select("*").eq("active", true).order("sort_order", { ascending: true });
    if (!data || !data.length) return;
    const groups = {};
    data.forEach((l) => { const s = l.section || "Company"; if (!groups[s]) groups[s] = []; groups[s].push(l); });
    cols.forEach((col) => {
      const h = col.querySelector("h4"); if (!h) return;
      const section = h.textContent.trim(); if (!groups[section]) return;
      col.innerHTML = `<h4>${escapeHTML(section)}</h4>`;
      groups[section].forEach((l) => { const a = document.createElement("a"); a.href = l.url || "#"; a.textContent = l.title || "Link"; col.appendChild(a); });
    });
  } catch (e) {}
}

/* ================= REVIEWS ================= */
async function loadReviews() {
  /* 🔴 DEMO MODE: real reviews load नहीं होंगे — HTML के hardcoded 3 cards दिखेंगे */
  if (DEMO_REVIEWS_MODE) return;

  const grid = document.getElementById("reviewsGrid");
  if (!grid) return;
  if (!supabaseClient) { grid.innerHTML = `<div class="loading">Reviews uplabdh nahi.</div>`; return; }
  try {
    const { data } = await supabaseClient.from("reviews").select("*").eq("approved", true).order("created_at", { ascending: false });
    if (!data || data.length === 0) { grid.innerHTML = `<div class="loading">Koi review nahi.</div>`; return; }
    grid.innerHTML = "";
    data.slice(0,6).forEach((r) => grid.appendChild(createReviewCard(r)));
  } catch (e) {}
}

function createReviewCard(review) {
  const card = document.createElement("div");
  card.className = "review-card";
  const rating = Number(review.rating) || 5;
  const stars = "★".repeat(rating) + "☆".repeat(5-rating);
  const name = review.customer_name && review.customer_name !== "Guest" ? review.customer_name : "Customer";
  const initial = name.charAt(0).toUpperCase();
  card.innerHTML = `<div class="review-stars">${stars}</div><p class="review-comment">"${escapeHTML(review.comment||"")}"</p><div class="review-author-row"><div class="review-avatar">${initial}</div><div><div class="review-author-name">${escapeHTML(name)}</div><div class="review-date">${formatArticleDate(review.created_at)}</div></div></div>`;
  return card;
}

function setupStarRating() {
  const wrap = document.getElementById("starRating");
  if (!wrap) return;
  const stars = wrap.querySelectorAll(".star");
  const hidden = document.getElementById("reviewRatingValue");
  let current = 0;
  function paint(n) { stars.forEach((s, i) => s.classList.toggle("active", i < n)); }
  stars.forEach((star) => {
    star.addEventListener("mouseenter", () => paint(Number(star.dataset.value)));
    star.addEventListener("click", () => {
      current = Number(star.dataset.value);
      hidden.value = current;
      paint(current);
    });
  });
  wrap.addEventListener("mouseleave", () => paint(current));
}

function setupReviewForm() {
  /* 🔴 DEMO MODE: form submit भी बंद */
  if (DEMO_REVIEWS_MODE) {
    const form = document.getElementById("reviewForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const msg = document.getElementById("reviewMessage");
        if (msg) msg.textContent = "Demo mode: review submit abhi बंद है।";
      });
    }
    return;
  }

  const form = document.getElementById("reviewForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const comment = document.getElementById("reviewComment")?.value.trim() || "";
    const rating = Number(document.getElementById("reviewRatingValue")?.value || 0);
    const msg = document.getElementById("reviewMessage");
    if (!rating) return msg && (msg.textContent = "Rating chunen (star par click karein).");
    if (!comment) return msg && (msg.textContent = "Comment likhein.");
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient.from("reviews").insert({
        customer_name: "Guest",
        rating: rating,
        comment: comment,
        approved: false
      });
      if (!error) {
        if (msg) msg.textContent = "Shukriya! Admin approval ke baad dikhega.";
        form.reset();
        document.getElementById("reviewRatingValue").value = "";
        document.querySelectorAll("#starRating .star").forEach(s => s.classList.remove("active"));
      }
    } catch (err) {}
  });
}

/* ================= CLOTH IMAGES ================= */
function setupClothImagePreviews() {
  const input = document.getElementById("clothImagesInput");
  const preview = document.getElementById("clothImagesPreview");
  if (!input || !preview) return;
  input.addEventListener("change", function () {
    const files = Array.from(input.files || []);
    const combined = [...selectedClothImages];
    files.forEach((f) => { if (combined.length < 6) combined.push(f); });
    selectedClothImages = combined.slice(0, 6);
    renderClothImagePreviews();
  });
}
function renderClothImagePreviews() {
  const preview = document.getElementById("clothImagesPreview");
  if (!preview) return;
  preview.innerHTML = "";
  selectedClothImages.forEach((file, i) => {
    const item = document.createElement("div"); item.className = "preview-item";
    const reader = new FileReader(); reader.onload = (e) => { item.style.backgroundImage = `url("${e.target.result}")`; }; reader.readAsDataURL(file);
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "remove-btn"; btn.textContent = "×";
    btn.addEventListener("click", () => { selectedClothImages.splice(i, 1); renderClothImagePreviews(); });
    item.appendChild(btn); preview.appendChild(item);
  });
}
function resetClothImagePreviews() {
  selectedClothImages = [];
  const p = document.getElementById("clothImagesPreview"); if (p) p.innerHTML = "";
  const i = document.getElementById("clothImagesInput"); if (i) i.value = "";
}
async function uploadClothImage(file) {
  if (!file || !supabaseClient) return null;
  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const name = `cloth-${Date.now()}-${Math.random().toString(36).substring(2,8)}.${ext}`;
    const { data, error } = await supabaseClient.storage.from(CLOTH_IMAGE_BUCKET).upload(name, file, { cacheControl: "3600", upsert: false, contentType: file.type || "image/jpeg" });
    if (error) return null;
    const { data: urlData } = supabaseClient.storage.from(CLOTH_IMAGE_BUCKET).getPublicUrl(data.path);
    return urlData?.publicUrl || null;
  } catch (e) { return null; }
}

async function submitBooking(e) {
  e.preventDefault();
  const name = document.getElementById("customerName")?.value.trim();
  const phone = document.getElementById("customerPhone")?.value.trim();
  const address = document.getElementById("customerAddress")?.value.trim();
  const pickupDate = document.getElementById("pickupDate")?.value;
  const pickupTime = document.getElementById("pickupTime")?.value;
  const clothDescription = document.getElementById("clothDescription")?.value.trim() || "";
  if (!name) return showMessage("Naam dalein.", true);
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) return showMessage("10 digit mobile number dalein.", true);
  if (!address) return showMessage("Address dalein.", true);
  if (!pickupDate) return showMessage("Pickup date chunen.", true);
  if (!pickupTime) return showMessage("Pickup time chunen.", true);
  const btn = bookingForm?.querySelector('button[type="submit"]');
  if (!btn) return;
  const oldText = btn.textContent; btn.disabled = true; btn.textContent = "Booking...";
  try {
    const urls = [];
    for (let i = 0; i < selectedClothImages.length; i++) {
      btn.textContent = `Upload ${i+1}/${selectedClothImages.length}...`;
      const url = await uploadClothImage(selectedClothImages[i]);
      if (url) urls.push(url);
    }
    const payload = { customer_name: name, phone: phone, address: address, pickup_date: pickupDate, pickup_time: pickupTime, cloth_description: clothDescription, cloth_details: clothDescription, status: "pending" };
    if (urls.length > 0) { payload.cloth_image = urls[0]; payload.cloth_images = urls; }
    let orderId = "ORD" + Date.now();
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from("orders").insert(payload).select("id, order_number").single();
      if (!error && data) orderId = data.order_number || data.id;
    }
    const waMsg = `*NEW ORDER - BASANTA Varanasi*%0A%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*Address:* ${address}%0A*Date:* ${pickupDate} ${pickupTime}%0A*Cloth:* ${clothDescription || 'Not mentioned'}%0A*OrderID:* ${orderId}%0A%0AVaranasi - Lanka/Sigra/Bhelupur/BHU`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`, '_blank');
    window.location.href = `success.html?order=${encodeURIComponent(orderId)}`;
  } catch (err) {
    showMessage("Technical problem.", true);
    btn.disabled = false; btn.textContent = oldText;
  }
}
function showMessage(msg, isError = false) {
  if (!bookingMessage) return;
  bookingMessage.textContent = msg;
  bookingMessage.style.color = isError ? "#c0392b" : "#176b52";
}
window.addEventListener("error", (e) => { console.error("Website Error:", e.error || e.message); });
