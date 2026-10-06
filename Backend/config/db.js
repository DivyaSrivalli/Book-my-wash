import mysql from "mysql2";
import "dotenv/config";

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Return DATE columns as plain "YYYY-MM-DD" strings instead of JS Date
    // objects, so date comparisons (e.g. in acceptBooking) work correctly.
    dateStrings: true
});

db.getConnection((error, connection) => {
    if (error) {
        console.log("Database connection failed");
        console.log(error);
        return;
    }

    console.log("MySQL connected successfully");

    connection.release();
});

export default db;