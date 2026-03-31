import express from "express";
import axios from "axios";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://f7bc779b8133054e3f3bfde61dbe1a4e.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "361e436b69da074f79c28ee5e87ae5c8", 
    secretAccessKey: "d94c8af153dbcec1e5fb88ab9411bbdf7408ab3769aa3a52a82d8e4ad7293044",
  },
});

app.post("/upload", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).send("الرابط مطلوب");

  try {
    const response = await axios({ method: "get", url: url, responseType: "stream" });
    const fileName = `video_${Date.now()}.mp4`;

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: "test", // تأكدي إن الاسم ده صح في R2 عندك
        Key: fileName,
        Body: response.data,
        ContentType: response.headers["content-type"] || "video/mp4",
      },
      queueSize: 4,
      partSize: 10 * 1024 * 1024, // قطع 10 ميجا للسرعة
    });

    await upload.done();
    res.json({ status: "done", link: `https://pub-f86f02f7d6f14299b253d8096c2c5b7d.r2.dev/${fileName}` });

  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
