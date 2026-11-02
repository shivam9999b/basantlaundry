
const fs = require("fs");
const path = require("path");

const DOMAIN = "https://basantlaundrys.netlify.app";
const ROOT = __dirname;

const excludedFolders = [
  "node_modules",
  ".git",
  ".netlify"
];

const urls = [];

function scanFolder(folder) {
  const items = fs.readdirSync(folder, { withFileTypes: true });

  for (const item of items) {
    if (item.name.startsWith(".")) continue;

    const fullPath = path.join(folder, item.name);

    if (item.isDirectory()) {
      if (!excludedFolders.includes(item.name)) {
        scanFolder(fullPath);
      }
      continue;
    }

    if (
      item.isFile() &&
      item.name.toLowerCase().endsWith(".html") &&
      item.name.toLowerCase() !== "404.html"
    ) {
      const relativePath = path.relative(ROOT, fullPath)
        .split(path.sep)
        .join("/");

      let urlPath = relativePath.replace(/(^|\/)index\.html$/i, "$1");

      if (relativePath.toLowerCase() === "index.html") {
        urlPath = "";
      }

      const encodedPath = urlPath
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");

      const lastmod = fs.statSync(fullPath)
        .mtime.toISOString().split("T")[0];

      urls.push({
        loc: `${DOMAIN}/${encodedPath}`,
        lastmod
      });
    }
  }
}

scanFolder(ROOT);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(
  path.join(ROOT, "sitemap.xml"),
  xml,
  "utf8"
);

console.log(`Sitemap generated: ${urls.length} URLs`);
