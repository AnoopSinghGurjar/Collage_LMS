import multer from "multer";
import path from "path";
import fs from "fs";

const facultyPath = "uploads/assignments/faculty";
const studentPath = "uploads/assignments/students";

// Create folders automatically
[facultyPath, studentPath].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const role = req.body.role;

    if (role === "faculty") {
      cb(null, facultyPath);
    } else {
      cb(null, studentPath);
    }
  },

  filename(req, file, cb) {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      unique + path.extname(file.originalname)
    );
  },
});

const allowedTypes = [
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "application/zip",

  "application/x-zip-compressed",
];

export const uploadAssignment = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter(req, file, cb) {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});