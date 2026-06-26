const fs = require("fs");
const cloudinary = require("cloudinary").v2;

// Configure cloudinary from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const isCloudEnabled = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

/**
 * Upload a resume file to Cloudinary.
 * Returns { provider, url, publicId } or null if cloud not configured.
 */
const uploadFileToCloud = async (filePath, fileName) => {
  if (!isCloudEnabled()) return null;

  try {
    const publicId = `resumes/${Date.now()}-${fileName.replace(/\.[^/.]+$/, "")}`;

    const result = await cloudinary.uploader.upload(filePath, {
      folder: process.env.CLOUDINARY_FOLDER || "resumely",
      public_id: publicId,
      resource_type: "raw",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    return {
      provider: "cloudinary",
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    console.warn("⚠️  Cloudinary upload failed:", err.message);
    return null; // graceful fallback to local storage
  }
};

/**
 * Delete a file from Cloudinary by its public_id.
 */
const deleteFileFromCloud = async (publicId) => {
  if (!isCloudEnabled() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (err) {
    console.warn("⚠️  Cloudinary delete failed:", err.message);
  }
};

module.exports = { uploadFileToCloud, deleteFileFromCloud, isCloudEnabled };
