// Check if we're on HTTPS
const isSecure = window.location.protocol === 'https:'
const statusEl = document.getElementById('status')!
const appEl = document.getElementById('app')!

if (isSecure) {
  statusEl.className = 'status secure'
  statusEl.innerHTML = '🔒 Secure connection established! You are accessing this page via HTTPS with a locally-trusted certificate.'
}
else {
  statusEl.className = 'status insecure'
  statusEl.innerHTML = '⚠️ Not secure - You are accessing this page via HTTP. Try accessing via the Caddy proxy URLs listed below.'
}

// Show connection details
appEl.innerHTML = `
  <h3>Connection Details:</h3>
  <ul>
    <li>Protocol: <code>${window.location.protocol}</code></li>
    <li>Host: <code>${window.location.host}</code></li>
    <li>Full URL: <code>${window.location.href}</code></li>
  </ul>

  <p>The content below should be transformed by the plugin:</p>
  <div style="padding: 10px; background: #f5f5f5; border-radius: 4px; margin-top: 10px;">
    __UNPLUGIN__
  </div>
`
// document.getElementById('app')!.innerHTML = '__UNPLUGIN__'
