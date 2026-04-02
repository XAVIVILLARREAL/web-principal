const fileId = '1Gu_-MckA_LpVy3PivQiTcC4mLSso3vNa';
const url = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

async function test() {
  try {
    const res3 = await fetch(`https://thingproxy.freeboard.io/fetch/${url}`);
    console.log('thingproxy status:', res3.status);
    console.log('thingproxy type:', res3.headers.get('content-type'));
  } catch (e) {
    console.error(e);
  }
}

test();
