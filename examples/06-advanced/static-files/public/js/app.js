/**
 * Numflow Static Files Demo - JavaScript
 */

// Test API call
async function testAPI() {
  const resultDiv = document.getElementById('result')
  resultDiv.textContent = '⏳ Calling API...'

  try {
    const response = await fetch('/api/health')
    const data = await response.json()

    resultDiv.textContent = `✅ API Response:\n\n${JSON.stringify(data, null, 2)}`
  } catch (error) {
    resultDiv.textContent = `❌ Error: ${error.message}`
  }
}

// Test cache
async function testCache() {
  const resultDiv = document.getElementById('result')
  resultDiv.textContent = '⏳ Checking cache headers...'

  try {
    // First request (no cache)
    const response1 = await fetch('/cached/index.html')
    const headers1 = {
      'Cache-Control': response1.headers.get('Cache-Control'),
      'ETag': response1.headers.get('ETag'),
      'Last-Modified': response1.headers.get('Last-Modified'),
    }

    // Second request (using ETag)
    const etag = response1.headers.get('ETag')
    const response2 = await fetch('/cached/index.html', {
      headers: { 'If-None-Match': etag }
    })

    resultDiv.textContent = `✅ Cache Test Results:

First Request:
- Status Code: ${response1.status} ${response1.statusText}
- Cache-Control: ${headers1['Cache-Control']}
- ETag: ${headers1['ETag']}
- Last-Modified: ${headers1['Last-Modified']}

Second Request (using ETag):
- Status Code: ${response2.status} ${response2.statusText}
${response2.status === 304 ? '✅ Cache is working properly! (304 Not Modified)' : '⚠️ Cache is not working.'}
`
  } catch (error) {
    resultDiv.textContent = `❌ Error: ${error.message}`
  }
}

// Check headers
async function checkHeaders() {
  const resultDiv = document.getElementById('result')
  resultDiv.textContent = '⏳ Checking headers...'

  try {
    const response = await fetch('/css/style.css')
    const headers = {}

    // Collect all headers
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    resultDiv.textContent = `✅ CSS File Headers:

${Object.entries(headers).map(([key, value]) => `${key}: ${value}`).join('\n')}

Key Features:
- Content-Type: ${headers['content-type']} (Automatic MIME type detection)
- Content-Length: ${headers['content-length']} bytes
- ETag: ${headers['etag']} (For cache validation)
- Cache-Control: ${headers['cache-control']}
`
  } catch (error) {
    resultDiv.textContent = `❌ Error: ${error.message}`
  }
}

// Welcome message on page load
window.addEventListener('DOMContentLoaded', () => {
  console.log('%c🚀 Numflow Static Files Demo', 'font-size: 20px; color: #667eea; font-weight: bold')
  console.log('%cThis page is served using numflow.static() middleware', 'font-size: 14px; color: #764ba2')
  console.log('Try the demo buttons above to test various features!')
})

// Scroll animation
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1'
      entry.target.style.transform = 'translateY(0)'
    }
  })
}, observerOptions)

document.querySelectorAll('section').forEach(section => {
  section.style.opacity = '0'
  section.style.transform = 'translateY(20px)'
  section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'
  observer.observe(section)
})
