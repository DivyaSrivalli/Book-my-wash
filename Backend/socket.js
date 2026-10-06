import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.user = decoded;

            next();

        } catch (error) {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user.userId;

        socket.join(`user_${userId}`);

        console.log(
            `User ${userId} connected: ${socket.id}`
        );

        socket.on("disconnect", () => {
            console.log(
                `User ${userId} disconnected`
            );
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};

export { initializeSocket, getIO };