import express from "express"
import cors from 'cors';
const app = express();

app.use(express.json());
app.use(cors());

app.post("/signup",(req,res)=>{

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