/**
 * WhatsApp conversation renderer using Puppeteer
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// Get chromium path from environment or common locations
function getChromiumPath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  
  const paths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  
  throw new Error('Chromium not found. Set PUPPETEER_EXECUTABLE_PATH environment variable.');
}

function generateHTML(config, options) {
  const { conversation } = config;
  const { darkMode, width } = options;
  
  const bgColor = darkMode ? '#0b141a' : '#efeae2';
  const headerBg = darkMode ? '#1f2c34' : '#075e54';
  const sentBubble = darkMode ? '#005c4b' : '#d9fdd3';
  const receivedBubble = darkMode ? '#1f2c34' : '#ffffff';
  const textColor = darkMode ? '#e9edef' : '#111b21';
  const timeColor = darkMode ? '#8696a0' : '#667781';
  const chatBg = darkMode 
    ? 'linear-gradient(rgba(11, 20, 26, 0.95), rgba(11, 20, 26, 0.95)), url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVQYV2NkIBIwEqmOgXCF/4nRQ7RCYjQTrZAYzUQrJEYz0QqJ0Uy0QmI0E62QGM1EKyRGM9EKidGMt0IAHQ4FIBLlYFoAAAAASUVORK5CYII=")' 
    : 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVQYV2NkIBIwEqmOgXCF/4nRQ7RCYjQTrZAYzUQrJEYz0QqJ0Uy0QmI0E62QGM1EKyRGM9EKidGMt0IAHQ4FIBLlYFoAAAAASUVORK5CYII=")';

  const messages = conversation.messages.map((msg, i) => {
    const isSent = msg.from === 'me';
    const bubbleBg = isSent ? sentBubble : receivedBubble;
    const align = isSent ? 'flex-end' : 'flex-start';
    const bubbleClass = isSent ? 'sent' : 'received';
    
    // Check if it's a consecutive message from same sender
    const prevMsg = conversation.messages[i - 1];
    const isConsecutive = prevMsg && prevMsg.from === msg.from;
    const marginTop = isConsecutive ? '2px' : '8px';
    
    return `
      <div class="message-row" style="justify-content: ${align}; margin-top: ${marginTop};">
        <div class="bubble ${bubbleClass}" style="background: ${bubbleBg};">
          <span class="text">${escapeHtml(msg.text)}</span>
          <span class="meta">
            <span class="time">${msg.time || ''}</span>
            ${isSent ? '<span class="status">✓✓</span>' : ''}
          </span>
        </div>
      </div>
    `;
  }).join('');

  const contactName = conversation.contact?.name || 'Contact';
  const contactStatus = conversation.contact?.status || 'online';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Text:wght@400;500&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 14.5px;
      line-height: 1.35;
      background: ${bgColor};
      width: ${width}px;
      min-height: 100vh;
    }
    
    .phone-container {
      width: 100%;
      background: ${bgColor};
    }
    
    /* Status bar */
    .status-bar {
      height: 44px;
      background: ${headerBg};
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
    
    .status-bar .time {
      font-weight: 600;
    }
    
    .status-bar .icons {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    
    /* Header */
    .header {
      height: 56px;
      background: ${headerBg};
      display: flex;
      align-items: center;
      padding: 0 8px;
      color: white;
    }
    
    .header .back {
      font-size: 24px;
      margin-right: 4px;
    }
    
    .header .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #128c7e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 500;
      margin-right: 12px;
    }
    
    .header .contact-info {
      flex: 1;
    }
    
    .header .contact-name {
      font-size: 16px;
      font-weight: 500;
    }
    
    .header .contact-status {
      font-size: 12px;
      opacity: 0.85;
    }
    
    .header .actions {
      display: flex;
      gap: 20px;
      font-size: 20px;
    }
    
    /* Chat area */
    .chat-area {
      background: ${chatBg};
      background-color: ${bgColor};
      min-height: calc(100vh - 100px - 56px);
      padding: 8px 12px;
    }
    
    .message-row {
      display: flex;
      margin-bottom: 1px;
    }
    
    .bubble {
      max-width: 85%;
      padding: 6px 8px 6px 9px;
      border-radius: 7.5px;
      position: relative;
      box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
    }
    
    .bubble.sent {
      border-top-right-radius: 0;
    }
    
    .bubble.received {
      border-top-left-radius: 0;
    }
    
    .bubble .text {
      color: ${textColor};
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .bubble .meta {
      float: right;
      margin: 4px 0 -4px 8px;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    
    .bubble .time {
      font-size: 11px;
      color: ${timeColor};
    }
    
    .bubble .status {
      font-size: 14px;
      color: #53bdeb;
      margin-left: 2px;
    }
    
    /* Input area */
    .input-area {
      height: 56px;
      background: ${darkMode ? '#1f2c34' : '#f0f2f5'};
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
    }
    
    .input-area .emoji {
      font-size: 24px;
      color: ${darkMode ? '#8696a0' : '#54656f'};
    }
    
    .input-area .input-box {
      flex: 1;
      height: 40px;
      background: ${darkMode ? '#2a3942' : '#ffffff'};
      border-radius: 20px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      color: ${darkMode ? '#8696a0' : '#667781'};
      font-size: 15px;
    }
    
    .input-area .mic {
      width: 40px;
      height: 40px;
      background: #00a884;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <div class="phone-container">
    <div class="status-bar">
      <span class="time">9:41</span>
      <span class="icons">
        <span>📶</span>
        <span>📡</span>
        <span>🔋</span>
      </span>
    </div>
    
    <div class="header">
      <span class="back">‹</span>
      <div class="avatar">${getInitials(contactName)}</div>
      <div class="contact-info">
        <div class="contact-name">${escapeHtml(contactName)}</div>
        <div class="contact-status">${contactStatus}</div>
      </div>
      <div class="actions">
        <span>📹</span>
        <span>📞</span>
        <span>⋮</span>
      </div>
    </div>
    
    <div class="chat-area">
      ${messages}
    </div>
    
    <div class="input-area">
      <span class="emoji">😊</span>
      <div class="input-box">Message</div>
      <span class="emoji">📎</span>
      <span class="emoji">📷</span>
      <div class="mic">🎤</div>
    </div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

async function renderConversation(config, options) {
  const { output, width = 390, darkMode = false } = options;
  
  const html = generateHTML(config, { darkMode, width });
  
  const browser = await puppeteer.launch({
    executablePath: getChromiumPath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    await page.setViewport({
      width: width,
      height: 800,
      deviceScaleFactor: 2
    });
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Get the actual content height
    const bodyHandle = await page.$('body');
    const boundingBox = await bodyHandle.boundingBox();
    
    // Take screenshot of full content
    await page.screenshot({
      path: output,
      type: output.endsWith('.jpg') || output.endsWith('.jpeg') ? 'jpeg' : 'png',
      clip: {
        x: 0,
        y: 0,
        width: width,
        height: Math.ceil(boundingBox.height)
      }
    });
    
    await bodyHandle.dispose();
  } finally {
    await browser.close();
  }
}

module.exports = { renderConversation };
