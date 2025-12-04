import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as any;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Promise para o upload funcionar com await
    const uploadToCloudinary = () =>
      new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profilePics" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result!.secure_url);
          }
        );
        stream.end(buffer);
      });

    const url = await uploadToCloudinary();

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Erro no upload:", err);
    return NextResponse.json({ error: "Erro no upload" }, { status: 500 });
  }
};
