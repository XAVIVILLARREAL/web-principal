const url = 'https://crm.xtremediagnostics.com/api/v1/accounts/1/conversations/1'; // just an example
const token = 'EQN2pbRUuBrjdwEmM7PYyjY6';

async function test() {
  try {
    const res = await fetch(url, { headers: { 'api-access-token': token } });
    console.log(res.status);
    const data = await res.json();
    console.log(Object.keys(data));
    if (data.meta) {
      console.log('meta keys:', Object.keys(data.meta));
      if (data.meta.sender) {
        console.log('sender:', data.meta.sender);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
test();
