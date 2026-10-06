import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const generateReceipt = async (booking) => {
    const receiptsDir = path.join(process.cwd(), "receipts");

    if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir);
    }

    const filePath = path.join(
        receiptsDir,
        `receipt-${booking.id}.pdf`
    );

    const doc = new PDFDocument();

    const stream = fs.createWriteStream(filePath);

   doc.pipe(stream);


    doc.fontSize(20).text("Laundry Booking Receipt", {
        align: "center"
    });

    doc.moveDown();

    doc.fontSize(12);

    doc.text(`Booking ID: ${booking.id}`);
    doc.text(`Name: ${booking.name}`);
    doc.text(`Email: ${booking.email}`);
    doc.text(`Booking Date: ${booking.bookingDate}`);
    doc.text(`Clothes Count: ${booking.clothesCount}`);
    doc.text(`Status: BOOKED`);

    doc.moveDown();

    doc.text("QR Code:");

    doc.image(booking.qrImage, {
        fit: [150, 150]
    });

    doc.end();
    await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
   })

    return filePath;
};

export { generateReceipt };