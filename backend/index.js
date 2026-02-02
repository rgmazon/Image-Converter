import express from "express";
import cors from "cors";
import multer from "multer";
import sharp from "sharp";
import archiver from "archiver";

const app = express();
app.use(cors());

const upload = multer({
  storage: multer.memoryStorage()
});

app.post("/convert", upload.array("images"), async (req, res) => {
  try {
    const { format, quality } = req.body;

    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=converted.zip"
    });

    const archive = archiver("zip", {
      zlib: { level: 9 }
    });

    archive.on("error", err => {
      throw err;
    });

    archive.pipe(res);

    for (const file of req.files) {
      let img = sharp(file.buffer);

      if (format === "webp") {
        img = img.webp({ quality: Number(quality) });
      }

      if (format === "avif") {
        img = img.avif({ quality: Number(quality) });
      }

      const buffer = await img.toBuffer();

      archive.append(buffer, {
        name: file.originalname.replace(/\.[^/.]+$/, "") + "." + format
      });
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).send("Conversion failed");
  }
});

app.listen(3000, () => console.log("Backend running on port 3000"));
