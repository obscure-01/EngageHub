const url = "https://www.youtube.com/shorts/EQoL38MIuPQ";

function getYouTubeVideoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    if (hostname === 'youtu.be') {
      const id = pathname.substring(1).split(/[?#]/)[0];
      return id.length === 11 ? id : null;
    }

    if (hostname.includes('youtube.com')) {
      if (pathname.startsWith('/shorts/') || pathname.startsWith('/embed/')) {
        const parts = pathname.split('/');
        const id = parts[2]?.split(/[?#]/)[0];
        return (id && id.length === 11) ? id : null;
      }
      if (pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return (id && id.length === 11) ? id : null;
      }
    }
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
  } catch (e) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
  }
  return null;
}

console.log("Extracted ID:", getYouTubeVideoId(url));
