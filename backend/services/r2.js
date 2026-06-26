import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary.
 * 
 * @param {Buffer} fileBuffer - The file content buffer
 * @param {string} fileName - The destination filename (key)
 * @param {string} mimeType - The mimetype of the file
 * @returns {Promise<string>} The secure URL of the uploaded file
 */
export function uploadFileToR2(fileBuffer, fileName, mimeType) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'mrphotographer',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
}
