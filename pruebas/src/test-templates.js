async function test() {
  const fileUrl = 'https://drive.google.com/uc?export=download&id=1Gu_-MckA_LpVy3PivQiTcC4mLSso3vNa&confirm=t';
  const encodedUrl = encodeURIComponent(fileUrl);
  const url = `https://api.allorigins.win/get?url=${encodedUrl}`;
  try {
    const res = await fetch(url);
    console.log(res.status);
    const data = await res.json();
    console.log(data.contents ? data.contents.substring(0, 50) : 'No contents');
  } catch (e) {
    console.error(e);
  }
}
test();
