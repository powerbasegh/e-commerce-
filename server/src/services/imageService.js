const cloudinary = require('cloudinary').v2;

// ---------------------------------------------------------------------------
// Product image uploads.
//
// Real Cloudinary integration, configured entirely through environment
// variables. Credentials never leave the server and are never sent to the
// browser — the file is posted to PowerBase, PowerBase uploads it, and only
// the resulting secure URL goes back.
//
// If the environment variables are absent the feature reports itself as
// unavailable and the upload endpoint returns 503. It does not silently
// pretend to work, and it does not fall back to storing the raw file
// anywhere. Vendors can still paste an image URL, exactly as before.
//
// Required env vars:
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
// Optional:
//   CLOUDINARY_FOLDER  (default: powerbase/products)
// ---------------------------------------------------------------------------

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

let configured = false;
function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

/**
 * Upload a product image buffer.
 *
 * Images are filed per vendor so an operator can attribute and clean up
 * assets. The vendor id comes from the authenticated session, never the
 * request body.
 *
 * @param {Buffer} buffer
 * @param {{ vendorId: number, mimetype: string, size: number }} meta
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number }>}
 */
async function uploadProductImage(buffer, { vendorId, mimetype, size }) {
  if (!isConfigured()) {
    throw Object.assign(new Error('Image upload is not configured on this server'), { status: 503 });
  }
  if (!ALLOWED_MIME.includes(mimetype)) {
    throw Object.assign(new Error('Only JPEG, PNG and WebP images are accepted'), { status: 400 });
  }
  if (size > MAX_BYTES) {
    throw Object.assign(new Error('Images must be 5MB or smaller'), { status: 400 });
  }

  ensureConfigured();
  const folder = `${process.env.CLOUDINARY_FOLDER || 'powerbase/products'}/vendor-${vendorId}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Cap stored dimensions so a vendor's phone photo doesn't become a
        // multi-megabyte payload on the customer catalogue.
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }],
      },
      (error, result) => {
        if (error) {
          reject(Object.assign(new Error('Image upload failed. Please try again.'), { status: 502 }));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );
    stream.end(buffer);
  });
}

module.exports = { uploadProductImage, isConfigured, MAX_BYTES, ALLOWED_MIME };
