
import {BrowserRouter,Routes,Route} from "react-router-dom"
import LandingPage from "./pages/Landing";
import AuthPage from "./pages/Authpage";
export default function App(){
  return (
 <BrowserRouter>
 <Routes>
  <Route path="/" element={<LandingPage/>}></Route>
  <Route path="/Authpage" element={<AuthPage/>}></Route>
 </Routes>
 </BrowserRouter>
  )
}