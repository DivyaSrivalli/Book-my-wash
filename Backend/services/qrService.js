import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const generateQRCode = async (qrToken, bookingId) => {

    const qrDir = path.join(process.cwd(), "qr");

    if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir);
    }

    const filePath = path.join(
        qrDir,
        `qr-${bookingId}.png`
    );

    await QRCode.toFile(filePath, qrToken);

    return filePath;
};

export { generateQRCode };