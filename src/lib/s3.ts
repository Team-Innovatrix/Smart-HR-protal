import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

/**
 * Generates a presigned URL for uploading a file directly from the client browser to S3.
 * @param fileName Original name of the file
 * @param fileType MIME type of the file
 * @param folder Optional folder path in the bucket
 * @returns Object containing the pre-signed URL and the final key (path) of the file
 */
export async function generatePresignedUrl(fileName: string, fileType: string, folder: string = 'uploads') {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET_NAME is not configured.');
  }

  // Create a unique key for the file to prevent overwrites
  const uniqueId = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${uniqueId}-${safeFileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  // URL expires in 5 minutes (300 seconds)
  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    url: presignedUrl,
    key: key,
    // The public URL to view the file (if bucket policy allows public reads)
    // For highly sensitive HR docs, you would generate a GET presigned url instead.
    publicUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`,
  };
}

/**
 * Directly uploads a JSON object or string data to S3 from the server.
 * Useful for automated backups (e.g. attendance records).
 */
export async function backupToS3(data: any, key: string, contentType: string = 'application/json') {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    console.error('AWS_S3_BUCKET_NAME is missing, skipping S3 backup.');
    return null;
  }

  try {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: stringData,
      ContentType: contentType,
    });

    const response = await s3Client.send(command);
    console.log(`✅ Successfully backed up data to S3: ${key}`);
    return response;
  } catch (error) {
    console.error(`❌ Failed to backup to S3: ${key}`, error);
    return null;
  }
}
