import { google } from "googleapis";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const folderId =
  process.env.GOOGLE_DRIVE_FOLDER_ID;

export default async function handler(req, res) {

  const form = formidable({});

  form.parse(req, async (err, fields, files) => {

    try {

      const file = files.file[0];

      const drive = google.drive({
        version: "v3",
        auth: await auth.getClient(),
      });

      const uploaded =
        await drive.files.create({

        requestBody: {
          name: file.originalFilename,
          parents: [folderId],
        },

        media: {
          mimeType: file.mimetype,
          body: fs.createReadStream(file.filepath),
        },

        fields: "id",
      });

      res.status(200).json({
        link:
          req.headers.origin +
          "/download.html?id=" +
          uploaded.data.id,
      });

    } catch(e){

      res.status(500).json({
        error: e.message
      });
    }
  });
}
