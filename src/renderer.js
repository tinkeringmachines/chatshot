/**
 * WhatsApp iOS conversation renderer using Puppeteer
 * Pixel-perfect recreation of WhatsApp iOS interface
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

// SVG Icons for iOS-style interface
const icons = {
  signal: `<svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4.5" y="5" width="3" height="6" rx="0.5"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5"/><rect x="13.5" y="0" width="3" height="11" rx="0.5"/></svg>`,
  wifi: `<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 3.5a8 8 0 0 1 5.66 2.34.75.75 0 0 0 1.06-1.06A9.5 9.5 0 0 0 8 2a9.5 9.5 0 0 0-6.72 2.78.75.75 0 0 0 1.06 1.06A8 8 0 0 1 8 3.5z"/><path d="M8 6.5a5 5 0 0 1 3.54 1.46.75.75 0 0 0 1.06-1.06A6.5 6.5 0 0 0 8 5a6.5 6.5 0 0 0-4.6 1.9.75.75 0 0 0 1.06 1.06A5 5 0 0 1 8 6.5z"/><circle cx="8" cy="10.5" r="1.5"/></svg>`,
  battery: `<svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor"><rect x="0" y="0" width="22" height="12" rx="2.5" stroke="currentColor" stroke-width="1" fill="none"/><rect x="2" y="2" width="18" height="8" rx="1"/><path d="M23 4v4a2 2 0 0 0 0-4z"/></svg>`,
  back: `<svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor"><path d="M10.5 1L2 10l8.5 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  video: `<svg width="26" height="18" viewBox="0 0 26 18" fill="currentColor"><rect x="0" y="0" width="18" height="18" rx="3"/><path d="M20 5l5-2.5v13L20 13V5z"/></svg>`,
  phone: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a2 2 0 0 1 2-2h2.5a1 1 0 0 1 .95.68l1.2 3.6a1 1 0 0 1-.27 1.02L6.6 8.08a10.5 10.5 0 0 0 5.32 5.32l1.78-1.78a1 1 0 0 1 1.02-.27l3.6 1.2a1 1 0 0 1 .68.95V16a2 2 0 0 1-2 2A15 15 0 0 1 2 3z"/></svg>`,
  checkDouble: `<svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5.5l3 3 6-7"/><path d="M6 5.5l3 3 6-7"/></svg>`,
  emoji: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/></svg>`,
  attach: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M19 11.5l-7.5 7.5a5 5 0 0 1-7-7l8-8a3 3 0 0 1 4.5 4.5l-8 8a1.5 1.5 0 0 1-2-2l7-7"/></svg>`,
  camera: `<svg width="24" height="20" viewBox="0 0 24 20" fill="currentColor"><path d="M9 0h6l2 3h4a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4l2-3z"/><circle cx="12" cy="11" r="4" fill="white"/></svg>`,
  mic: `<svg width="18" height="24" viewBox="0 0 18 24" fill="currentColor"><rect x="5" y="0" width="8" height="14" rx="4"/><path d="M1 10v2a8 8 0 0 0 16 0v-2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 18v4M5 22h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
};

function generateHTML(config, options) {
  const { conversation } = config;
  const { darkMode, width } = options;
  
  // iOS WhatsApp exact colors
  const colors = darkMode ? {
    statusBar: '#1f2c34',
    header: '#1f2c34',
    chatBg: '#0b141a',
    sentBubble: '#005c4b',
    receivedBubble: '#202c33',
    text: '#e9edef',
    timeText: 'rgba(233, 237, 239, 0.6)',
    inputBg: '#1f2c34',
    inputBox: '#2a3942',
    inputText: '#8696a0',
    checkRead: '#53bdeb',
    headerText: '#ffffff',
    statusText: 'rgba(255,255,255,0.7)',
  } : {
    statusBar: '#075e54',
    header: '#075e54',
    chatBg: '#e5ddd5',
    sentBubble: '#dcf8c6',
    receivedBubble: '#ffffff',
    text: '#303030',
    timeText: 'rgba(0, 0, 0, 0.45)',
    inputBg: '#f0f0f0',
    inputBox: '#ffffff',
    inputText: '#8696a0',
    checkRead: '#4fc3f7',
    headerText: '#ffffff',
    statusText: 'rgba(255,255,255,0.8)',
  };

  // Chat wallpaper pattern (subtle)
  const chatPattern = darkMode 
    ? `background-color: ${colors.chatBg};`
    : `background-color: #e5ddd5; background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ccc' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");`;

  const messages = conversation.messages.map((msg, i) => {
    const isSent = msg.from === 'me';
    const bubbleBg = isSent ? colors.sentBubble : colors.receivedBubble;
    
    // Check if it's a consecutive message from same sender
    const prevMsg = conversation.messages[i - 1];
    const isFirst = !prevMsg || prevMsg.from !== msg.from;
    const nextMsg = conversation.messages[i + 1];
    const isLast = !nextMsg || nextMsg.from !== msg.from;
    
    // Tail only on first message of group
    const tailClass = isFirst ? (isSent ? 'tail-sent' : 'tail-received') : '';
    const marginTop = isFirst ? '8px' : '2px';
    
    return `
      <div class="message-row ${isSent ? 'sent' : 'received'}" style="margin-top: ${marginTop};">
        <div class="bubble ${tailClass}" style="background: ${bubbleBg};">
          <span class="text">${escapeHtml(msg.text)}</span>
          <span class="meta">
            <span class="time">${msg.time || ''}</span>
            ${isSent ? `<span class="status">${icons.checkDouble}</span>` : ''}
          </span>
        </div>
      </div>
    `;
  }).join('');

  const contactName = conversation.contact?.name || 'Contact';
  const contactStatus = conversation.contact?.status || 'online';
  const avatarUrl = conversation.contact?.avatar;
  const avatarContent = avatarUrl 
    ? `<img src="${avatarUrl}" class="avatar-img"/>` 
    : `<span class="avatar-initials">${getInitials(contactName)}</span>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 17px;
      line-height: 1.3;
      -webkit-font-smoothing: antialiased;
      width: ${width}px;
      min-height: 100vh;
      background: ${colors.chatBg};
    }
    
    .phone-container {
      width: 100%;
    }
    
    /* iOS Status bar */
    .status-bar {
      height: 47px;
      background: ${colors.statusBar};
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 0 20px 8px;
      color: white;
    }
    
    .status-bar .time {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.3px;
    }
    
    .status-bar .icons {
      display: flex;
      gap: 5px;
      align-items: center;
    }
    
    .status-bar .icons svg {
      height: 12px;
      width: auto;
    }
    
    /* WhatsApp Header */
    .header {
      height: 44px;
      background: ${colors.header};
      display: flex;
      align-items: center;
      padding: 0 4px;
      color: ${colors.headerText};
    }
    
    .header .back-btn {
      display: flex;
      align-items: center;
      padding: 8px 4px 8px 0;
      color: ${colors.headerText};
    }
    
    .header .back-btn svg {
      width: 12px;
      height: 20px;
    }
    
    .header .back-text {
      font-size: 17px;
      margin-left: 4px;
      color: #34b7f1;
    }
    
    .header .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 10px 0 4px;
      overflow: hidden;
    }
    
    .header .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .header .avatar-initials {
      font-size: 14px;
      font-weight: 600;
      color: white;
    }
    
    .header .contact-info {
      flex: 1;
    }
    
    .header .contact-name {
      font-size: 16px;
      font-weight: 600;
    }
    
    .header .contact-status {
      font-size: 12px;
      color: ${colors.statusText};
    }
    
    .header .actions {
      display: flex;
      gap: 20px;
      padding-right: 8px;
    }
    
    .header .actions svg {
      width: 22px;
      height: 22px;
      color: ${colors.headerText};
    }
    
    /* Chat area */
    .chat-area {
      ${chatPattern}
      min-height: calc(100vh - 91px - 52px);
      padding: 4px 8px 8px;
    }
    
    .message-row {
      display: flex;
      margin-bottom: 1px;
    }
    
    .message-row.sent {
      justify-content: flex-end;
    }
    
    .message-row.received {
      justify-content: flex-start;
    }
    
    .bubble {
      max-width: 80%;
      padding: 6px 7px 8px 9px;
      border-radius: 7.5px;
      position: relative;
      box-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13);
    }
    
    .bubble.tail-sent {
      border-top-right-radius: 0;
    }
    
    .bubble.tail-sent::after {
      content: '';
      position: absolute;
      top: 0;
      right: -8px;
      width: 8px;
      height: 13px;
      background: inherit;
      clip-path: polygon(0 0, 0 100%, 100% 0);
    }
    
    .bubble.tail-received {
      border-top-left-radius: 0;
    }
    
    .bubble.tail-received::before {
      content: '';
      position: absolute;
      top: 0;
      left: -8px;
      width: 8px;
      height: 13px;
      background: inherit;
      clip-path: polygon(100% 0, 0 0, 100% 100%);
    }
    
    .bubble .text {
      color: ${colors.text};
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 17px;
      line-height: 1.3;
    }
    
    .bubble .meta {
      float: right;
      margin: 3px 0 -5px 12px;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    
    .bubble .time {
      font-size: 11px;
      color: ${colors.timeText};
    }
    
    .bubble .status {
      display: flex;
      align-items: center;
    }
    
    .bubble .status svg {
      width: 16px;
      height: 11px;
      color: ${colors.checkRead};
    }
    
    /* Input area */
    .input-area {
      height: 52px;
      background: ${colors.inputBg};
      display: flex;
      align-items: center;
      padding: 6px 8px;
      gap: 8px;
    }
    
    .input-area .icon-btn {
      color: ${colors.inputText};
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }
    
    .input-area .icon-btn svg {
      width: 24px;
      height: 24px;
    }
    
    .input-area .input-box {
      flex: 1;
      height: 36px;
      background: ${colors.inputBox};
      border-radius: 18px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      color: ${colors.inputText};
      font-size: 17px;
      border: none;
    }
    
    .input-area .mic-btn {
      width: 36px;
      height: 36px;
      background: #00a884;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .input-area .mic-btn svg {
      width: 20px;
      height: 20px;
    }
  </style>
</head>
<body>
  <div class="phone-container">
    <div class="status-bar">
      <span class="time">9:41</span>
      <span class="icons">
        ${icons.signal}
        ${icons.wifi}
        ${icons.battery}
      </span>
    </div>
    
    <div class="header">
      <div class="back-btn">
        ${icons.back}
        <span class="back-text">12</span>
      </div>
      <div class="avatar">${avatarContent}</div>
      <div class="contact-info">
        <div class="contact-name">${escapeHtml(contactName)}</div>
        <div class="contact-status">${escapeHtml(contactStatus)}</div>
      </div>
      <div class="actions">
        ${icons.video}
        ${icons.phone}
      </div>
    </div>
    
    <div class="chat-area">
      ${messages}
    </div>
    
    <div class="input-area">
      <div class="icon-btn">${icons.emoji}</div>
      <div class="input-box">Message</div>
      <div class="icon-btn">${icons.attach}</div>
      <div class="icon-btn">${icons.camera}</div>
      <div class="mic-btn">${icons.mic}</div>
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
      deviceScaleFactor: 3  // High DPI for crisp rendering
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
