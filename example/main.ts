const isSecure = window.location.protocol === 'https:'
const statusElement = document.querySelector('div#status')
if (!statusElement)
  throw new Error('Status element not found')
const appElement = document.querySelector('div#app')
if (!appElement)
  throw new Error('App element not found')

if (isSecure) {
  statusElement.className = 'status secure'
  statusElement.innerHTML = '🔒 Secure connection established! You are accessing this page via HTTPS with a locally-trusted certificate.'
}
else {
  statusElement.className = 'status insecure'
  statusElement.innerHTML = '⚠️ Not secure - You are accessing this page via HTTP. Try accessing via the Caddy proxy URLs listed below.'
}

appElement.innerHTML = /* html */ `
<h3>Connection Details:</h3>
<ul>
  <li>Protocol: <code>${window.location.protocol}</code></li>
  <li>Host: <code>${window.location.host}</code></li>
  <li>Full URL: <code>${window.location.href}</code></li>
</ul>

<p>The content below should be transformed by the plugin:</p>
`
