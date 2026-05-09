import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

export default async function handler(req, res) {

  try {

    const fileId = req.query.id;

    const drive = google.drive({
      version: "v3",
      auth: await auth.getClient(),
    });

    const meta =
      await drive.files.get({
        fileId,
        fields: "name",
      });

    const response =
      await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      {
        responseType: "stream",
      }
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${meta.data.name}"`
    );

    response.data.pipe(res);

    response.data.on("end", async () => {

      try {

        await drive.files.delete({
          fileId,
        });

      } catch {}
    });

  } catch(e){

    res.status(500).send(e.message);
  }
}
