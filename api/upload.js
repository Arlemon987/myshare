import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT
  ),
  scopes: [
    "https://www.googleapis.com/auth/drive"
  ],
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req, res) {

  try {

    if(req.method !== "POST"){
      return res.status(405).end();
    }

    const drive = google.drive({
      version:"v3",
      auth: await auth.getClient(),
    });

    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer =
      Buffer.concat(chunks);

    const boundary =
      req.headers["content-type"]
      .split("boundary=")[1];

    const parts =
      buffer.toString().split(boundary);

    const filePart =
      parts.find(part =>
        part.includes("filename=")
      );

    if(!filePart){

      return res.status(400).json({
        error:"No file uploaded"
      });
    }

    const start =
      filePart.indexOf("\r\n\r\n") + 4;

    const end =
      filePart.lastIndexOf("\r\n");

    const fileBuffer =
      Buffer.from(
        filePart.substring(start, end),
        "binary"
      );

    const match =
      filePart.match(/filename="(.+)"/);

    const filename =
      match ? match[1] : "file";

    const uploaded =
      await drive.files.create({

      requestBody:{
        name:filename,
        parents:[
          process.env.GOOGLE_DRIVE_FOLDER_ID
        ],
      },

      media:{
        mimeType:"application/octet-stream",
        body:ReadableFromBuffer(fileBuffer),
      },

      fields:"id",
    });

    return res.status(200).json({

      success:true,

      link:
        req.headers.origin +
        "/download.html?id=" +
        uploaded.data.id,
    });

  } catch(e){

    return res.status(500).json({
      error:e.message
    });
  }
}

function ReadableFromBuffer(buffer){

  const { Readable } = require("stream");

  const stream = new Readable();

  stream.push(buffer);
  stream.push(null);

  return stream;
}
