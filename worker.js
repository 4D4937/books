export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      
      // 检查路径格式
      if (!path.endsWith('/') && !path.match(/\/sitemap-\d+\.xml$/)) {
        return new Response('Invalid sitemap URL format', { 
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // 检查数据库连接
      if (!env.BOOKS_D1) {
        throw new Error('Database connection not configured');
      }

      const db = env.BOOKS_D1;
      const urlsPerFile = 50000;
      
      // 获取总记录数并处理数据库错误
      let countResult;
      try {
        countResult = await db.prepare(
          "SELECT COUNT(*) as total FROM books"
        ).first();
      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to query database');
      }

      if (!countResult) {
        throw new Error('No data found in database');
      }

      const total = countResult.total;
      const sitemapCount = Math.ceil(total / urlsPerFile);

      // 处理主站点地图请求
      if (path.endsWith('/sitemap.xml')) {
        // 检查是否有数据
        if (total === 0) {
          return new Response('No sitemap data available', { 
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }

        let mainSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        mainSitemap += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        for (let i = 1; i <= sitemapCount; i++) {
          mainSitemap += `  <sitemap>\n`;
          mainSitemap += `    <loc>https://liberpdf.top/sitemap-${i}.xml</loc>\n`;
          mainSitemap += `  </sitemap>\n`;
        }
        
        mainSitemap += '</sitemapindex>';
        
        return new Response(mainSitemap, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
      
      // 处理分站点地图请求
      const sitemapMatch = path.match(/sitemap-(\d+)\.xml$/);
      if (!sitemapMatch) {
        return new Response('Invalid sitemap file name', { 
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      const sitemapNum = parseInt(sitemapMatch[1]);
      if (sitemapNum < 1 || sitemapNum > sitemapCount) {
        return new Response(`Invalid sitemap number. Available range: 1-${sitemapCount}`, { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      const offset = (sitemapNum - 1) * urlsPerFile;
      let books;
      try {
        books = await db.prepare(
          "SELECT id FROM books LIMIT ? OFFSET ?"
        ).bind(urlsPerFile, offset).all();
      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to fetch book data');
      }
      
      if (!books || !books.results || books.results.length === 0) {
        return new Response('No data found for this sitemap', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      let subSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      subSitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      for (const book of books.results) {
        subSitemap += `  <url>\n`;
        subSitemap += `    <loc>https://liberpdf.top/book/${book.id}</loc>\n`;
        subSitemap += `  </url>\n`;
      }
      
      subSitemap += '</urlset>';
      
      return new Response(subSitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });

    } catch (error) {
      console.error('Error generating sitemap:', error);
      return new Response(`Internal Server Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};