
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://basantlaundrys.netlify.app";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// केवल जरूरी Public Pages
const PUBLIC_PAGES = [
  "index.html",
  "About.html",
  "contact.html",
  "Cancellation Policy.html",
  "dislemer.html",
  "privacy policy.html",
  "terms and conditions.html"
];

const ARTICLE_PAGE = "article.html";

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, char => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;"
  })[char]);
}

function getDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

async function getPublishedArticles() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  const articles = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const apiUrl = new URL(`${SUPABASE_URL}/rest/v1/articles`);

    apiUrl.searchParams.set("select", "id,created_at");
    apiUrl.searchParams.set("published", "eq.true");
    apiUrl.searchParams.set("order", "created_at.desc");

    const response = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${offset}-${offset + limit - 1}`
      }
    });

    if (!response.ok) {
      throw new Error(
        `Supabase error ${response.status}: ${await response.text()}`
      );
    }

    const batch = await response.json();
    articles.push(...batch);

    if (batch.length < limit) break;

    offset += limit;
  }

  return articles;
}

async function generateSitemap() {
  const entries = [];

  // Public pages जोड़ें, केवल जब वे वास्तव में मौजूद हों
  for (const file of PUBLIC_PAGES) {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
      console.warn(`Public page not found, skipped: ${file}`);
      continue;
    }

    const pageUrl = new URL(
      file === "index.html" ? "/" : `/${file}`,
      SITE_URL
    );

    entries.push({
      loc: pageUrl.href,
      lastmod: getDate(fs.statSync(filePath).mtime)
    });
  }

  // Article page मौजूद होना जरूरी है
  if (!fs.existsSync(path.join(__dirname, ARTICLE_PAGE))) {
    throw new Error(`${ARTICLE_PAGE} was not found.`);
  }

  // Supabase से Published Articles लें
  const articles = await getPublishedArticles();

  for (const article of articles) {
    if (article.id === null || article.id === undefined) continue;

    const articleUrl = new URL(`/${ARTICLE_PAGE}`, SITE_URL);
    articleUrl.searchParams.set("id", article.id);

    entries.push({
      loc: articleUrl.href,
      lastmod: article.created_at
        ? getDate(article.created_at)
        : new Date().toISOString().slice(0, 10)
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`).join("\n")}
</urlset>
`;

  fs.writeFileSync(
    path.join(__dirname, "sitemap.xml"),
    xml,
    "utf8"
  );

  console.log("Sitemap generated successfully!");
  console.log(`Public pages: ${PUBLIC_PAGES.length}`);
  console.log(`Published articles: ${articles.length}`);
  console.log(`Total URLs: ${entries.length}`);
}

generateSitemap().catch(error => {
  console.error("Sitemap generation failed:", error);
  process.exit(1);
});
