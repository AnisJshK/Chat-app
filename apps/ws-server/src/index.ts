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

function broadcast(data:any){
    users.forEach(u=>{
        u.socket.send(JSON.stringify(data));
    });
};

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", async(socket, request) => {

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

    await prismaClient.user.update({
        where:{id:userId},
        data:{isOnline:true}
    })

    const user: UserSocket = {
        socket,
        userId
    };
    users.push(user);
    broadcast({
        type:"online",
        userId
    });

    socket.on("message", async (message) => {

        try {
            const parsed = JSON.parse(message.toString());

          
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


            if (parsed.type === "chat") {

                if (!user.roomId) {
                    socket.send(JSON.stringify({
                        type: "error",
                        message: "Join a room first"
                    }));
                    return;
                }

                const messageText = parsed.message;

               const newMessage =  await prismaClient.message.create({
                    data: {
                        content: messageText,
                        userId,
                        roomId: user.roomId,
                        status:"SENT"
                    }
                });

                const roomUsers = users.filter(
                    u => u.roomId === user.roomId
                );

                roomUsers.forEach(u => {
                    u.socket.send(JSON.stringify({
                        type: "chat",
                        message: {
                            id:newMessage.id,
                            text:newMessage.content,
                            senderId:userId,
                            createdAt:newMessage.createdAt,
                            status:"DELIVERED"
                        }
                    }));
                });
                await prismaClient.message.update({
                    where:{id:newMessage.id},
                    data:{status:"DELIVERED"}
                });
                return;
            }
            if(parsed.type==="read"){
                const  {roomId} = parsed;

                await prismaClient.roomMember.update({
                    where:{
                        userId_roomId:{
                            userId,
                            roomId,
                        },
                    },
                    data:{
                        lastReadAt:new Date(),
                    },
                });
                const roomUsers = users.filter(
                    (u)=> u.roomId===roomId
                );
                roomUsers.forEach((u)=>{
                    u.socket.send(JSON.stringify({
                        type:"read",
                        userId,
                        roomId,
                    }));
                });
                //update message status => read
                await prismaClient.message.updateMany({
                    where:{
                        roomId,
                        NOT:{userId},
                    },
                    data:{
                        status:"READ"
                    },
                });
                return;
            }

        } catch (error) {
            socket.send(JSON.stringify({
                type: "error",
                message: "Invalid message format"
            }));
        }
    });

    socket.on("close", async() => {
        users = users.filter(u => u.socket !== socket);

        await prismaClient.user.update({
            where:{id:userId},
            data:{
                isOnline:false,
                lastSeen:new Date(),
            },
        });
        broadcast({
            type:"offline",
            userId,
        });
    });
});

console.log("websocket running on port 8080");