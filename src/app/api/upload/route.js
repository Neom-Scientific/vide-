import { sendMail } from "@/lib/send-mail";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Readable } from "stream";


export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const internal_id = formData.get('internal_id');
  const testName = formData.get('testName');
  console.log('file:', file);
  try {
    const response = []
    if (!file) {
      response.push({
        message: 'No file uploaded',
        status: 400
      })
      return NextResponse.json(response);
    }
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const drive = google.drive({ version: "v3", auth });
    const responseFromApi = await drive.files.create({
      requestBody: {
        name: `${internal_id}_${testName}`, // Use internal_id as file name
        // parents: ["1xzTkB-k3PxEbGpvj4yoHXxBFgAtCLz1p"], // Your folder ID
        parents:["1pOZrtxF7N3wATWjqQqofzNCO_lgTjpSb"]
      },
      media: {
        mimeType: file.type,
        body: Readable.from(fileBuffer),
      },
      supportsAllDrives: true,
      driveId: "0AGcjkp59qA5iUk9PVA", // Your shared drive ID
    });
    await sendMail(
      'spoc@strivebiocorp.com',
      `Report Uploaded: ${internal_id} - ${testName}`,
      `<p>The Report for <strong>${internal_id} - ${testName}</strong> has been successfully uploaded to Dashboard.</p>
      <p>You can view the Report <a href="https://drive.google.com/file/d/${responseFromApi.data.id}/view?usp=sharing" target="_blank">here</a>.</p>
      <p>This is an automated message. Please do not reply.</p>
      <p>Best regards,<br/><strong>NEOM Scientific Solutions Team</strong></p>
      `
    )
    response.push({
      message: 'File uploaded successfully',
      fileId: responseFromApi.data.id,
      status: 200
    })
    return NextResponse.json(response);
  }
  catch (error) {
    console.error('Error handling upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}