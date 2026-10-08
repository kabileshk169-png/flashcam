async function getMoreCams() {
  const popularUrl = 'https://webcamera24.com/popular/';
  const res = await fetch(popularUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const links = Array.from(html.matchAll(/href="(\/camera\/[^"]+)"/g)).map(m => 'https://webcamera24.com' + m[1]);
  const uniqueLinks = Array.from(new Set(links));
  console.log('Found camera links:', uniqueLinks.slice(0, 20));

  const additionalCams = [];
  for (const link of uniqueLinks) {
    if (additionalCams.length >= 8) break;
    // Skip if in the original 8
    const existing = [
      'sturgis-motorcycle-rally',
      'lasvegas-bridge-street-cam',
      'bandai-bridge-cam',
      'nantucket-lower-main-street-cam',
      'philadelphia-triangle-square-cam',
      '4464-klin-ceh',
      'muscatine-merrill-hotel-railcam',
      'ritz-livecam'
    ];
    if (existing.some(e => link.includes(e))) continue;

    try {
      const cRes = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const cHtml = await cRes.text();
      const iframeMatch = cHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      const videoMatch = cHtml.match(/"embedUrl":\s*"([^"]+)"/i);
      const contentUrlMatch = cHtml.match(/"contentUrl":\s*"([^"]+)"/i);
      const thumbMatch = cHtml.match(/"thumbnailUrl":\s*"([^"]+)"/i);
      const h1Match = cHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);

      if (iframeMatch || videoMatch) {
        additionalCams.push({
          pageUrl: link,
          title: h1Match ? h1Match[1].trim() : 'Live Camera',
          iframeSrc: iframeMatch ? iframeMatch[1] : (videoMatch ? videoMatch[1] + '?autoplay=1' : ''),
          embedUrl: videoMatch ? videoMatch[1] : (iframeMatch ? iframeMatch[1] : ''),
          contentUrl: contentUrlMatch ? contentUrlMatch[1] : '',
          thumbnailUrl: thumbMatch ? thumbMatch[1] : ''
        });
        console.log(`Added Cam ${additionalCams.length + 8}:`, h1Match ? h1Match[1].trim() : link);
      }
    } catch (e) {
      // skip
    }
  }

  console.log('RESULT JSON:');
  console.log(JSON.stringify(additionalCams, null, 2));
}

getMoreCams();
