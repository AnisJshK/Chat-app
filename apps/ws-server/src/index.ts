import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { prismaClient } from "@repo/db/client";

const JWT_SECRET = "34gfgarg45gfbrw";

type JwtPayload = {
    userId: string
}

interface UserSocket {
    socket: WebSocket,
    userId: string,
    roomId?: string
}

let users: UserSocket[] = [];

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket, request) => {

    const params = new URLSearchParams(request.url?.split("?")[1]);
    const token = params.get("token");

    if (!token) {
        socket.close();
        return;
    }

    let userId: string;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        userId = decoded.userId;
    } catch (error) {
        socket.close();
        return;
    }

    const user: UserSocket = {
        socket,
        userId
    };

    users.push(user);

    socket.on("message", async (message) => {

        try {
            const parsed = JSON.parse(message.toString());

            /* ---------------- JOIN ROOM ---------------- */

            if (parsed.type === "join_room") {

                const roomId = parsed.roomId;

                const membership = await prismaClient.roomMember.findFirst({
                    where: {
                        roomId,
                        userId
                    }
                });

                if (!membership) {
                    socket.send(JSON.stringify({
                        type: "error",
                        message: "Not a member of this room!!"
                    }));
                    return;
                }

                user.roomId = roomId;

                socket.send(JSON.stringify({
                    type: "joined",
                    roomId
                }));
            }

            /* ---------------- CHAT ---------------- */

            if (parsed.type === "chat") {

                if (!user.roomId) {
                    socket.send(JSON.stringify({
                        type: "error",
                        message: "Join a room first"
                    }));
                    return;
                }

                const messageText = parsed.message;

                await prismaClient.message.create({
                    data: {
                        content: messageText,
                        userId,
                        roomId: user.roomId
                    }
                });

                const roomUsers = users.filter(
                    u => u.roomId === user.roomId
                );

                roomUsers.forEach(u => {
                    u.socket.send(JSON.stringify({
                        type: "chat",
                        message: messageText,
                        userId
                    }));
                });
            }

        } catch (error) {
            socket.send(JSON.stringify({
                type: "error",
                message: "Invalid message format"
            }));
        }
    });

    socket.on("close", () => {
        users = users.filter(u => u.socket !== socket);
    });

});

console.log("websocket running on port 8080");