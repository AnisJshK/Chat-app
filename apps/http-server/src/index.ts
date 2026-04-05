import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CreateUserSchema, RoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import userMiddleware from "./userMiddleware";
import dotenv from "dotenv";
dotenv.config();
// import {JWT_SECRET} from "@repo/backend-common/dist/config"
const app = express();
app.use(express.json());
app.use(cors());

// const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_SECRET = "34gfgarg45gfbrw";


app.post("/user/signup", async (req, res) => {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Incorrect Inputs!!!!" });
  }

  const { email, password } = parsed.data;

  const userexists = await prismaClient.user.findUnique({ where: { email } });
  if (userexists) {
    return res.status(402).json({ message: "User already exists!!!!" }); // ✅ return added
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prismaClient.user.create({
      data: { email, password: hashedPassword },
    });
    return res.json({ userId: user.id });
  } catch (error) {
    return res.status(500).json({ message: "Could not create user" });
  }
});

app.post("/user/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "User not found!!!!" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Password Incorrect!!!" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    return res.json({ token });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Signin failed" });
  }
});

app.post("/user/createroom", userMiddleware, async (req: any, res) => {
  const parsed = RoomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.message }); // ✅ return added
  }

  const { name } = parsed.data;

  try {
    const room = await prismaClient.room.create({ data: { name } });
    await prismaClient.roomMember.create({
      data: { roomId: room.id, userId: req.userId },
    });
    return res.json({ roomId: room.id });
  } catch (error) {
    return res.status(500).json({ message: "Could not create room" });
  }
});

app.post("/user/joinroom", userMiddleware, async (req: any, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    return res.status(400).json({ message: "roomId is required" });
  }

  const existing = await prismaClient.roomMember.findUnique({
    where: { userId_roomId: { userId: req.userId, roomId } },
  });

  if (existing) {
    return res.status(400).json({ message: "Already a member of this room" });
  }

  try {
    await prismaClient.roomMember.create({
      data: { roomId, userId: req.userId },
    });
    return res.json({ message: "Joined room successfully!!!" });
  } catch (error) {
    return res.status(400).json({ message: "Invalid room" }); // ✅ uncommented
  }
});

app.get("/user/rooms", userMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;
    const memberhips = await prismaClient.roomMember.findMany({
      where:{userId},
      include:{
        room:{
          include:{
            messages:{
              orderBy:{createdAt:"desc"},
              take:1,
            },
          },
        },
      }
    })

    const rooms = await Promise.all(
      memberhips.map(async(m)=>{
        const lastMessage = m.room.messages[0];

        const unread = await prismaClient.message.count({
          where:{
            roomId:m.roomId,
            createdAt:{
              gt:m.lastReadAt||new Date(0),
            },
            NOT:{
              userId,
            },
          }
        });
        return{
          roomId:m.room.id,
          name:m.room.name,

          lastMessage:lastMessage?.content||"",
          time:lastMessage?.createdAt||m.room.createdAt,
          unread,
        };
      })
    );
    return res.json({rooms});
  } catch (error) {
    
  }
});

app.get("/messages/:roomId", userMiddleware, async (req: any, res) => {
  const roomId = req.params.roomId;
  const userId = req.userId;
  const messages = await prismaClient.message.findMany({
    where: { roomId },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const formatted = messages.map((m)=>({
    id:m.id,
    text:m.content,
    senderId:m.userId,
    createdAt:m.createdAt,
    status:m.status,
  }));
  return res.json({ messages:formatted });
});

app.get("/user/profile",userMiddleware,async(req:any,res)=>{
  try {
    const user = await prismaClient.user.findUnique({
      where:{id:req.userId},
      select:{
        id:true,
        email:true,
        isOnline:true,
        lastSeen:true,
      }
    });
    return res.json({user})
  } catch (error) {
    return res.status(500).json({message:"Failed to fetch user"});
  }

})
app.post("/messages/read",userMiddleware,async(req:any,res)=>{
  const {roomId} = req.body;

  await prismaClient.roomMember.update({
    where:{
      userId_roomId:{
        userId:req.userId,
        roomId,
      },
    },
    data:{
      lastReadAt:new Date(),
    },
  });
  return res.json({
    message:"Marked as read"
  });
})

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`server running on PORT ${PORT}`);
});