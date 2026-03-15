import {z,email} from "zod";

export const CreateUserSchema = z.object({
    email:z.string().email("Invalid email address"),
    password:z.string().min(8,"Password must be atleast 8 characters!!"),
})

export const RoomSchema = z.object({
    name:z.string().min(1,"Room Name is required!!").max(50),
})

export const MessageSchema = z.object({
    content:z.string().min(1,"Message cannot be empty!!"),
    userId:z.string().uuid(),
    roomId:z.string().uuid()
})