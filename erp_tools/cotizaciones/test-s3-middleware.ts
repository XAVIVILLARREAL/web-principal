import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: 'https://s3.xtremediagnostics.com',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'PMVOF73TI5D7H0HQ0PX3',
    secretAccessKey: 'GyQgYLdOu8jp2KzAl58vy92EqTPS7DA+0KpiUz2l'
  },
  forcePathStyle: true
});

s3Client.middlewareStack.add(
  (next) => async (args: any) => {
    if (args.request && args.request.headers) {
      args.request.headers['ngrok-skip-browser-warning'] = '69420';
      args.request.headers['Bypass-Tunnel-Reminder'] = 'true';
    }
    return next(args);
  },
  {
    step: 'build',
  }
);

async function test() {
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: 'cotizaciones-xtreme',
      Key: 'test-file.txt',
      Body: 'hello world',
      ContentType: 'text/plain'
    }));
    console.log('Success!');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
