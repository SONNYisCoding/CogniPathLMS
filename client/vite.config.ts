import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
      headers: {
        // Dòng này cho phép trang web giao tiếp với Popup (Google Login)
        // "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        
        // Setting this to 'unsafe-none' ensures compatibility with Google Picker & GAPI
        "Cross-Origin-Opener-Policy": "unsafe-none",        
        
        // Nếu vẫn lỗi, thử thêm dòng này (tùy chọn):
        "Cross-Origin-Embedder-Policy": "unsafe-none" 
      },
      port: 5173, 
    },
})