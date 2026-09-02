import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },

  fileFilter(req, file, cb) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only jpeg, png, webp and avif images are allowed"));
    }

    cb(null, true);
  },
});

export default upload;
