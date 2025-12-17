import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from "sonner";
import UserProvider from '@/context/UserContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <App />
      <Toaster position="top-center" richColors />
    </UserProvider>
  </StrictMode>,
)
