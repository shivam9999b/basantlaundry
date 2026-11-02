
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://basantlaundrys.netlify.app";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const PUBLIC_PAGES = [
  "index.html",
  "About.html",
  "contact.html",
  "Cancellation Policy.html",
  "dislemer.html",
  "privacy policy.html",
  "terms and conditions.html"
];

function escapeXML(value) {
  return String(value).replace(/[<>&'"]/g, char => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  })[char]);
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

async function getPublishedArticles() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY missing");
  }

  const articles = [];
  const pageSize = 500;
  let offset = 0;

  while (true) {
    const url = new URL(
      "/rest/v1/articles",
      SUPABASE_URL
    );

    url.searchParams.set(
      "select",
      "id,slug,created_at"
    );

    url.searchParams.set(
      "published",
      "eq.true"
    );

    url.searchParams.set(
      "order",
      "created_at.desc"
    );

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Range: `${offset}-${offset + pageSize - 1}`
      }
    });

    if (!response.ok) {
      throw new Error(
        `Supabase error ${response.status}: ${await response.text()}`
      );
    }

    const batch = await response.json();

    articles.push(...batch);

    if (batch.length < pageSize) break;

    offset += pageSize;
  }

  return articles;
}

function makeUrl(loc, lastmod) {
  return `
  <url>
    <loc>${escapeXML(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
  </url>`;
}

async function generateSitemap() {
  const urls = [];

  // Public static pages
  for (const page of PUBLIC_PAGES) {
    const filePath = path.join(__dirname, page);

    if (!fs.existsSync(filePath)) {
      console.log("Page not found, skipping:", page);
      continue;
    }

    const lastmod = formatDate(
      fs.statSync(filePath).mtime
    );

    const pageUrl = page === "index.html"
      ? `${SITE_URL}/`
      : `${SITE_URL}/${encodeURIComponent(page).replace(/%2F/g, "/")}`;

    urls.push(makeUrl(pageUrl, lastmod));
  }

  // Article page must exist
  if (!fs.existsSync(path.join(__dirname, "article.html"))) {
    throw new Error("article.html not found");
  }

  // Published Supabase articles
  const articles = await getPublishedArticles();

  for (const article of articles) {
    if (!article.slug || !article.slug.trim()) {
      console.log("Skipping article without slug:", article.id);
      continue;
    }

    const articleUrl = new URL(
      "/article.html",
      SITE_URL
    );

    articleUrl.searchParams.set("slug", article.slug);

    urls.push(
      makeUrl(
        articleUrl.toString(),
        formatDate(article.created_at)
      )
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  fs.writeFileSync(
    path.join(__dirname, "sitemap.xml"),
    xml,
    "utf8"
  );

  console.log("Sitemap generated successfully!");
  console.log("Static pages:", PUBLIC_PAGES.length);
  console.log("Published articles:", articles.length);
  console.log("Total sitemap URLs:", urls.length);
}

generateSitemap().catch(error => {
  console.error("Sitemap generation failed:", error);
  process.exit(1);
});
