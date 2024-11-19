// Worker 脚本 (模块格式)

// 引入数据库绑定
const d1Database = BOOKS_D1;  // D1 数据库绑定，Cloudflare 会自动注入

const URL_BATCH_SIZE = 50000;

// 查询 D1 数据库，获取书籍 ID
async function fetchBookIds() {
  const result = await d1Database.prepare("SELECT id FROM books LIMIT 1000000").all();
  return result.rows.map(row => row.id);
}

// 生成站点地图的 XML 格式
function generateSitemap(urls, baseUrl) {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  const xmlFooter = '\n</urlset>';

  const xmlUrls = urls.map(id => {
    return `<url>\n  <loc>${baseUrl}/id${id}</loc>\n  <lastmod>${new Date().toISOString()}</lastmod>\n</url>`;
  }).join("\n");

  return xmlHeader + xmlUrls + xmlFooter;
}

// 处理请求
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// 请求处理逻辑
async function handleRequest(request) {
  const bookIds = await fetchBookIds();
  const baseUrl = "https://liberpdf.top";

  // 按每 50000 个 URL 生成批次
  const batches = [];
  for (let i = 0; i < bookIds.length; i += URL_BATCH_SIZE) {
    batches.push(bookIds.slice(i, i + URL_BATCH_SIZE));
  }

  // 生成主站点地图（第一个批次）
  const mainSitemap = generateSitemap(batches[0], baseUrl);

  // 生成分站点地图（剩余批次）
  const sitemapFiles = batches.map((batch, index) => {
    const sitemap = generateSitemap(batch, baseUrl);
    return {
      filename: `sitemap${index + 1}.xml`,
      content: sitemap
    };
  });

  // 返回主站点地图
  if (request.url.endsWith("/sitemap.xml")) {
    return new Response(mainSitemap, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }

  // 返回分站点地图
  for (const sitemapFile of sitemapFiles) {
    if (request.url.endsWith(sitemapFile.filename)) {
      return new Response(sitemapFile.content, {
        headers: {
          "Content-Type": "application/xml",
        },
      });
    }
  }

  // 默认 404 响应
  return new Response('Not Found', {
    status: 404,
  });
}
