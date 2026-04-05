import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
// import { JWT_SECRET } from "@repo/backend-common/dist/config";

// const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_SECRET = "34gfgarg45gfbrw"
export interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
export default function userMiddleware(req:Request,res:Response,next:NextFunction){

    const header = req.headers.authorization;
    if(!header||!header.startsWith("Bearer")){
        return res.status(401).json({
            error:"Missing or malformed token"
        })
        
    }
    const token = header.split(" ")[1];
    if(!token){
        return res.status(401).json({
            error:"Missing token"
        })
    }

    try {
        const decoded = jwt.verify(token,JWT_SECRET as string) as unknown as JwtPayload;
        req.userId = decoded.userId;
        next();
        
    } catch (error) {
        if(error instanceof jwt.TokenExpiredError){
            return res.status(401).json({error:"Token expired!!"});
        }
        return res.status(401).json({
            error:"Invalid Token!!!"
        })
        
    }


}