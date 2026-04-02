const fileUrl = 'https://drive.google.com/uc?export=download&id=1Gu_-MckA_LpVy3PivQiTcC4mLSso3vNa&confirm=t';
const encodedUrl = encodeURIComponent(fileUrl);
const urls = [
  `https://api.codetabs.com/v1/proxy/?quest=${encodedUrl}`,
  `https://corsproxy.io/?${encodedUrl}`,
  `https://api.allorigins.win/raw?url=${encodedUrl}`
];

async function test() {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(url, res.status, res.headers.get('content-type'));
    } catch (e) {
      console.log(url, 'Error:', e.message);
    }
  }
}
test();
