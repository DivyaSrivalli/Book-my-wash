import "dotenv/config";
import http from "http";
import { initializeSocket } from "./socket.js";
import app from "./index.js";

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

initializeSocket(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
