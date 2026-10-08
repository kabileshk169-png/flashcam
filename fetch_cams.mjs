const urls = [
  'https://webcamera24.com/camera/usa/sturgis-motorcycle-rally/',
  'https://webcamera24.com/camera/usa/lasvegas-bridge-street-cam/',
  'https://webcamera24.com/camera/japan/bandai-bridge-cam/',
  'https://webcamera24.com/camera/usa/nantucket-lower-main-street-cam/',
  'https://webcamera24.com/camera/usa/philadelphia-triangle-square-cam/',
  'https://webcamera24.com/camera/russia/4464-klin-ceh/',
  'https://webcamera24.com/camera/usa/muscatine-merrill-hotel-railcam/',
  'https://webcamera24.com/camera/portugal/ritz-livecam/'
];

async function checkUrls() {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      const html = await res.text();
      const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      const videoMatch = html.match(/"embedUrl":\s*"([^"]+)"/i);
      const contentUrlMatch = html.match(/"contentUrl":\s*"([^"]+)"/i);
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const thumbMatch = html.match(/"thumbnailUrl":\s*"([^"]+)"/i);
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      console.log(`CAM_${i+1}:`, JSON.stringify({
        title: h1Match ? h1Match[1].trim() : (titleMatch ? titleMatch[1].trim() : 'Camera ' + (i+1)),
        pageUrl: url,
        iframeSrc: iframeMatch ? iframeMatch[1] : null,
        embedUrl: videoMatch ? videoMatch[1] : null,
        contentUrl: contentUrlMatch ? contentUrlMatch[1] : null,
        thumbnailUrl: thumbMatch ? thumbMatch[1] : null
      }, null, 2));
    } catch (e) {
      console.error(`Cam ${i+1} error:`, e.message);
    }
  }
}
checkUrls();
