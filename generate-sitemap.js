

const fs = require("fs");

const SITE_URL = "https://basantlaundrys.netlify.app";
const ARTICLE_PAGE = "article.html";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is missing");
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, char => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;"
  })[char]);
}

async function generateSitemap() {
  const articles = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/articles`);

    url.searchParams.set("select", "id,created_at");
    url.searchParams.set("published", "eq.true");
    url.searchParams.set("order", "created_at.desc");

    const response = await fetch(url, {
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

  const today = new Date().toISOString().slice(0, 10);

  const entries = [
    {
      loc: `${SITE_URL}/`,
      lastmod: today
    },
    ...articles.map(article => {
      const articleUrl = new URL(
        `${SITE_URL}/${ARTICLE_PAGE}`
      );

      articleUrl.searchParams.set("id", article.id);

      return {
        loc: articleUrl.href,
        lastmod: article.created_at
          ? new Date(article.created_at).toISOString().slice(0, 10)
          : today
      };
    })
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(item => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${item.lastmod}</lastmod>
  </url>`).join("\n")}
</urlset>`;

  fs.writeFileSync("sitemap.xml", xml, "utf8");

  console.log(`SUCCESS: ${articles.length} published articles added.`);
}

generateSitemap().catch(error => {
  console.error("Sitemap generation failed:", error);
  process.exit(1);
});
