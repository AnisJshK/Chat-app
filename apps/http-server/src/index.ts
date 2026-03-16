import express from "express"
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import {JWT_SECRET} from '@repo/backend-common';
import {CreateUserSchema, RoomSchema} from "@repo/common/types"
import {prismaClient} from "@repo/db/client"
import userMiddleware from "./userMiddleware";
const app = express();

app.use(express.json());
app.use(cors());

const JWT_SECRET = "34gfgarg45gfbrw";

app.post("/user/signup",async(req,res)=>{
    const parsed = CreateUserSchema.safeParse(req.body);
    if(!parsed.success){
        res.json({
            message:"Incorrect Inputs!!!!"
        })
        return;
    }

    const {email,password} = parsed.data;

    const userexists = await prismaClient.user.findUnique({where:{email}})
    if(userexists){
        res.status(402).json({
            message:"User already exists!!!!"
        })
    }
   
    try {
         const hashedPassword = await bcrypt.hash(password,10);
        const user = await prismaClient.user.create({
            data:{
                email:parsed.data?.email,
                password:hashedPassword,
            },
        })
        res.json({
            userId : user.id
        })
        
    } catch (error) {
        res.status(411).json({
            message:"User already exists with this username"
        })
    }


})
app.post("/user/signin",async(req,res)=>{
    try {
        const {email,password} = req.body;

        const user = await prismaClient.user.findUnique({where:{email}});
        if(!user){
            return res.status(400).json({
                message:"User not found!!!!"
            });
        }

        const valid = await bcrypt.compare(password,user.password);
        if(!valid){
            return res.status(400).json({
                message:"Password Incorrect!!!"
            })
        }

        const token = jwt.sign({
            userId : user.id,
        },JWT_SECRET);

        res.json({
            token
        })
    } catch (error) {
        res.json({
            message:error
        })
    }
})
app.post("/user/createroom",userMiddleware,async(req:any,res)=>{
     const parsed = RoomSchema.safeParse(req.body);
     if(!parsed.success){
        res.status(400).json({
            message:parsed.error.message,
        })
     }
     const {name} = parsed.data!;
     try {
        const room = await prismaClient.room.create({
            data:{
                name
            }
        })
        await prismaClient.roomMember.create({
            data:{
                roomId:room.id,
                userId:req.userId
            }
        })
        res.json({
            roomId:room.id
        });
     } catch (error) {
        //  console.log(error);
        return res.status(500).json({
            
            message:"Could not create room",
            error
        })
       
     }
})
app.post("/user/joinroom",userMiddleware,async(req:any,res)=>{
    const {roomId} = req.body;

    try {
        await prismaClient.roomMember.create({
            data:{
                roomId,
                userId:req.userId
            }
        });
        res.json({
            message:"Joined room successfully!!!"
        })
    } catch (error) {
        console.log(error)

        // return res.status(400).json({
        //     message:"Already Joined room or invalid room!!!"
        // })
    }

})

app.get("/user/rooms",userMiddleware,async(req:any,res)=>{
    const rooms = await prismaClient.roomMember.findMany({
        where:{
            userId:req.userId
        },
        include:{
            room:true
        }
    });
    res.json({
        rooms
    })
})

app.get("/messages/:roomId",userMiddleware,async(req:any,res)=>{
    const roomId = req.params.body;

    const messages = await prismaClient.message.findMany({
        where:{
            roomId
        },
        include:{
            user:{
                select:{
                    email:true
                }
            }
        },
        orderBy:{
            createdAt:"desc"
        },
        take:50
    })
    res.json({
        messages
    })
})

const PORT = 3001;

app.listen(PORT,()=>{
    console.log(`server running on PORT ${PORT} `);
})