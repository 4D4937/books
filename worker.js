export default {
  async fetch(request, env, ctx) {
    try {
      const db = env.BOOKS_D1;
      const urlsPerFile = 50000;
      const baseUrl = 'https://liberpdf.top';
      
      // 获取总记录数
      const countResult = await db.prepare(
        "SELECT COUNT(*) as total FROM books"
      ).first();
      
      if (!countResult || countResult.total === 0) {
        return new Response('No data available', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      const total = countResult.total;
      const sitemapCount = Math.ceil(total / urlsPerFile);
      
      // 创建主站点地图
      let mainSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      mainSitemap += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // 创建一个数组来存储所有的子站点地图内容
      const subSitemaps = [];
      
      // 生成所有子站点地图
      for (let i = 1; i <= sitemapCount; i++) {
        // 添加到主站点地图
        mainSitemap += `  <sitemap>\n`;
        mainSitemap += `    <loc>${baseUrl}/sitemap-${i}.xml</loc>\n`;
        mainSitemap += `  </sitemap>\n`;
        
        // 获取这个子站点地图的数据
        const offset = (i - 1) * urlsPerFile;
        const books = await db.prepare(
          "SELECT id FROM books LIMIT ? OFFSET ?"
        ).bind(urlsPerFile, offset).all();
        
        let subSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        subSitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        for (const book of books.results) {
          subSitemap += `  <url>\n`;
          subSitemap += `    <loc>${baseUrl}/book/${book.id}</loc>\n`;
          subSitemap += `    <changefreq>monthly</changefreq>\n`;
          subSitemap += `    <priority>0.8</priority>\n`;
          subSitemap += `  </url>\n`;
        }
        
        subSitemap += '</urlset>';
        subSitemaps.push({
          filename: `sitemap-${i}.xml`,
          content: subSitemap
        });
      }
      
      mainSitemap += '</sitemapindex>';
      
      // 创建ZIP文件
      const zip = new JSZip();
      
      // 添加主站点地图到ZIP
      zip.file('sitemap.xml', mainSitemap);
      
      // 添加所有子站点地图到ZIP
      subSitemaps.forEach(sitemap => {
        zip.file(sitemap.filename, sitemap.content);
      });
      
      // 生成ZIP文件
      const zipContent = await zip.generateAsync({type: 'blob'});
      
      // 返回ZIP文件下载
      return new Response(zipContent, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="sitemaps.zip"',
          'Cache-Control': 'no-cache'
        }
      });
      
    } catch (error) {
      console.error('Error generating sitemap archive:', error);
      return new Response(`Error generating sitemap archive: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};