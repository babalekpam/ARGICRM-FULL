export async function extractImagesFromWebsite(websiteUrl: string): Promise<string[]> {
  try {
    
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    const imageUrls: string[] = [];
    
    // 1. Extract Open Graph image (priority - usually hero image)
    const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
    const ogMatch = html.match(ogImageRegex);
    if (ogMatch) {
      imageUrls.push(ogMatch[1]);
    }
    
    // Alternative OG image format (content before property)
    const ogImageRegex2 = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i;
    const ogMatch2 = html.match(ogImageRegex2);
    if (ogMatch2 && !imageUrls.includes(ogMatch2[1])) {
      imageUrls.push(ogMatch2[1]);
    }
    
    // 2. Extract Twitter card image
    const twitterImageRegex = /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i;
    const twitterMatch = html.match(twitterImageRegex);
    if (twitterMatch && !imageUrls.includes(twitterMatch[1])) {
      imageUrls.push(twitterMatch[1]);
    }
    
    // 3. Extract regular <img> tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    let imgCount = 0;
    while ((match = imgRegex.exec(html)) !== null && imgCount < 20) {
      const imgUrl = match[1];
      if (!imageUrls.includes(imgUrl)) {
        imageUrls.push(imgUrl);
        imgCount++;
      }
    }
    
    // 4. Convert relative URLs to absolute
    const absoluteUrls = imageUrls.map(url => {
      try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        if (url.startsWith('//')) {
          return 'https:' + url;
        }
        if (url.startsWith('/')) {
          const baseUrl = new URL(websiteUrl);
          return baseUrl.origin + url;
        }
        return new URL(url, websiteUrl).href;
      } catch (error) {
        return null;
      }
    }).filter((url): url is string => url !== null);
    
    // 5. Filter out tiny images (icons, tracking pixels, etc.)
    const filteredUrls = absoluteUrls.filter(url => {
      const urlLower = url.toLowerCase();
      
      if (url.startsWith('data:')) return false;
      
      if (urlLower.endsWith('.svg')) return false;
      
      if (urlLower.includes('icon')) return false;
      if (urlLower.includes('logo') && !urlLower.includes('hero')) return false;
      if (urlLower.includes('favicon')) return false;
      if (urlLower.includes('avatar')) return false;
      if (urlLower.includes('emoji')) return false;
      if (urlLower.includes('badge')) return false;
      if (urlLower.includes('sprite')) return false;
      if (urlLower.includes('tracking')) return false;
      if (urlLower.includes('pixel')) return false;
      if (urlLower.includes('1x1')) return false;
      
      const dimensionMatch = url.match(/(\d+)x(\d+)/);
      if (dimensionMatch) {
        const width = parseInt(dimensionMatch[1]);
        const height = parseInt(dimensionMatch[2]);
        if (width < 400 || height < 300) return false;
      }
      
      return true;
    });
    
    
    const topImages = filteredUrls.slice(0, 3);
    if (topImages.length > 0) {
    } else {
    }
    
    return topImages;
    
  } catch (error: any) {
    console.error('❌ Failed to extract images from website:', error.message);
    return [];
  }
}
