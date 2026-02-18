import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Reset default browser styles
const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 0; }
  button:focus, input:focus, select:focus, textarea:focus { outline: 2px solid #4f46e5; outline-offset: 1px; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
