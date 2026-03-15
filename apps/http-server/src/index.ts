import express from "express"
import cors from 'cors';
import {CreateUserSchema} from "@repo/common/types"
import {prismaClient} from "@repo/db/client"
const app = express();

app.use(express.json());
app.use(cors());

app.post("/signup",async(req,res)=>{
    const parsed = CreateUserSchema.safeParse(req.body);
    if(!parsed.success){
        res.json({
            message:"Incorrect Inputs!!!!"
        })
        return;
    }
    
    try {
        const user = await prismaClient.user.create({
            data:{
                email:parsed.data?.email,
                password:parsed.data?.password,
            }
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
app.post("/signin",(req,res)=>{

})
app.post("/createroom",(req,res)=>{

})
app.get("/room",(req,res)=>{

})


const PORT = 3001;

app.listen(PORT,()=>{
    console.log(`server running on PORT ${PORT} `);
})