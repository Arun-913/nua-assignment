import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signin from '@/pages/Signin'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
import Share from '@/pages/Share'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/share/:id" element={<Share />} />
      </Routes>
    </Router>
  )
}

export default App
