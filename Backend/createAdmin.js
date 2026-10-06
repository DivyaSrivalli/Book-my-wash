// Run with: node createAdmin.js
// Creates (or upgrades) an ADMIN user in the database so you can log in
// to the Admin Dashboard.

import "dotenv/config";
import bcrypt from "bcrypt";
import db from "./config/db.js";

const ADMIN_NAME = "Admin";
const ADMIN_EMAIL = "admin@laundry.com";
const ADMIN_PASSWORD = "Admin@123";

const run = async () => {
    try {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        const [existing] = await db.promise().query(
            "SELECT id FROM users WHERE email = ?",
            [ADMIN_EMAIL]
        );

        if (existing.length > 0) {
            await db.promise().query(
                "UPDATE users SET password = ?, role = 'ADMIN' WHERE email = ?",
                [hash, ADMIN_EMAIL]
            );
            console.log(`Existing user ${ADMIN_EMAIL} updated to ADMIN.`);
        } else {
            await db.promise().query(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'ADMIN')",
                [ADMIN_NAME, ADMIN_EMAIL, hash]
            );
            console.log(`Admin user created: ${ADMIN_EMAIL}`);
        }

        console.log(`Login with email "${ADMIN_EMAIL}" and password "${ADMIN_PASSWORD}"`);
        console.log("Change this password after your first login.");

    } catch (error) {
        console.error("Failed to create admin:", error);
    } finally {
        process.exit();
    }
};

run();
