import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const S3_CONFIG = {
  endpoint: 'https://s3.xtremediagnostics.com',
  bucket: 'cotizaciones-xtreme',
  accessKey: 'PMVOF73TI5D7H0HQ0PX3',
  secretKey: 'GyQgYLdOu8jp2KzAl58vy92EqTPS7DA+0KpiUz2l'
};

export const s3Client = new S3Client({
  endpoint: S3_CONFIG.endpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: S3_CONFIG.accessKey,
    secretAccessKey: S3_CONFIG.secretKey,
  },
  forcePathStyle: true,
});

export const getPresignedS3Url = async (pathOrUrl: string): Promise<string> => {
  if (!pathOrUrl) return '';
  
  try {
    // Extract key from full URL if necessary
    let key = pathOrUrl;
    const bucketPrefix = `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/`;
    if (pathOrUrl.startsWith(bucketPrefix)) {
      key = pathOrUrl.substring(bucketPrefix.length);
    }

    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    // Generate a presigned URL valid for 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return pathOrUrl; // Fallback to original URL
  }
};

export const openS3File = async (pathOrUrl: string) => {
  const url = await getPresignedS3Url(pathOrUrl);
  window.open(url, '_blank', 'noopener,noreferrer');
};
