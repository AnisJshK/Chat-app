
import {BrowserRouter,Routes,Route} from "react-router-dom"
import LandingPage from "./pages/Landing";
import AuthPage from "./pages/Authpage";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/Chat";
export default function App(){
  return (
 <BrowserRouter>
 <Routes>
  <Route path="/" element={<LandingPage/>}></Route>
  <Route path="/Authpage" element={<AuthPage/>}></Route>
  <Route path="/Dashboard" element={<Dashboard/>}></Route>
  <Route path="/messages" element={<ChatPage/>}></Route>
 </Routes>
 </BrowserRouter>
  )
}