// GitHub API configuration
const GITHUB_REPO = 'lilka-dev/keira';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

// ESP32 flash configuration
const ESP32_FLASH_CONFIG = {
  flashSize: '16MB',
  flashMode: 'dio',
  flashFreq: '80m'
};

// Current flash state
let currentFirmware = null;
let currentVersion = null;
let selectedFileData = null;
let espLoaderTerminal = null;
let port = null;
let isFlashing = false;

// DOM elements
const releasesList = document.getElementById('releasesList');
const loadingEl = document.getElementById('loading');
const browserWarning = document.getElementById('browserWarning');
const flashModal = document.getElementById('flashModal');
const flashVersion = document.getElementById('flashVersion');
const downloadLink = document.getElementById('downloadLink');
const downloadFileName = document.getElementById('downloadFileName');
const firmwareFileInput = document.getElementById('firmwareFile');
const fileInputText = document.getElementById('fileInputText');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const flashProgress = document.getElementById('flashProgress');
const flashLog = document.getElementById('flashLog');
const flashBtn = document.getElementById('flashBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Check Web Serial API support
function checkWebSerialSupport() {
  const isSecureContext = window.isSecureContext;
  const hasSerial = 'serial' in navigator;

  console.log('Secure context:', isSecureContext);
  console.log('Has serial:', hasSerial);
  console.log('Protocol:', window.location.protocol);

  if (!isSecureContext) {
    browserWarning.innerHTML =
        '<p>⚠️ Web Serial API потребує HTTPS або localhost. Поточний протокол: ' +
        window.location.protocol + '</p>';
    browserWarning.style.display = 'block';
    return false;
  }

  if (!hasSerial) {
    browserWarning.innerHTML =
        '<p>⚠️ Ваш браузер не підтримує Web Serial API. Використовуйте Chrome 89+, Edge 89+ або Opera 75+.</p>';
    browserWarning.style.display = 'block';
    return false;
  }

  return true;
}

// Format date to Ukrainian locale
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(
      'uk-UA', {year: 'numeric', month: 'long', day: 'numeric'});
}

// Format file size
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Parse release body (markdown) to simple text
function parseMarkdown(text) {
  if (!text) return '';
  return text.replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .substring(0, 500);
}

// Find firmware binary in release assets
function findFirmwareBinary(assets) {
  // Priority: merged binary > firmware.bin > any .bin
  const priorities = [
    a => a.name.toLowerCase().includes('merged') && a.name.endsWith('.bin'),
    a => a.name.toLowerCase() === 'firmware.bin',
    a => a.name.toLowerCase().includes('keira') && a.name.endsWith('.bin'),
    a => a.name.endsWith('.bin') && !a.name.includes('bootloader') &&
        !a.name.includes('partition')
  ];

  for (const check of priorities) {
    const found = assets.find(check);
    if (found) return found;
  }

  return assets.find(a => a.name.endsWith('.bin'));
}

// Find all merged firmware files (different languages)
function findAllMergedFirmware(assets) {
  const merged = assets.filter(
      a => a.name.toLowerCase().includes('merged') && a.name.endsWith('.bin'));

  if (merged.length > 0) return merged;

  // Fallback to any .bin file
  return assets.filter(
      a => a.name.endsWith('.bin') && !a.name.includes('bootloader') &&
          !a.name.includes('partition'));
}

// Get language name from filename
function getLangFromFilename(filename) {
  const match = filename.match(/LANG_(\w+)/i);
  if (match) {
    const lang = match[1].toUpperCase();
    const langNames = {
      'UK': '🇺🇦 Українська',
      'UA': '🇺🇦 Українська',
      'EN': '🇬🇧 English',
      'DE': '🇩🇪 Deutsch',
      'PL': '🇵🇱 Polski',
      'ES': '🇪🇸 Español',
      'FR': '🇫🇷 Français',
    };
    return langNames[lang] || lang;
  }
  return filename;
}

// Logging functions
function log(message, type = 'info') {
  const p = document.createElement('p');
  p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  p.className = `log-${type}`;
  flashLog.appendChild(p);
  flashLog.scrollTop = flashLog.scrollHeight;
  console.log(`[${type}] ${message}`);
}

function clearLog() {
  flashLog.innerHTML = '';
}

function updateProgress(percent, text) {
  progressFill.style.width = `${percent}%`;
  if (text) {
    progressText.textContent = text;
    progressText.className = 'progress-text';
  }
}

function setProgressState(state, text) {
  progressText.textContent = text;
  progressText.className = `progress-text ${state}`;
}

// Modal functions
let currentFirmwareOptions = [];

function openFlashModal(version, firmwareList) {
  currentVersion = version;
  currentFirmwareOptions = firmwareList;
  currentFirmware = firmwareList[0];
  selectedFileData = null;

  flashVersion.textContent = version;

  // Build firmware options HTML
  const firmwareOptionsEl = document.getElementById('firmwareOptions');
  firmwareOptionsEl.innerHTML =
      firmwareList
          .map((fw, index) => {
            const langName = getLangFromFilename(fw.name);
            const isFirst = index === 0;
            return `
      <a href="${fw.browser_download_url}" class="btn btn-download ${
                isFirst ? 'recommended' : ''}" download>
        📥 ${langName}
        <span class="file-size">${formatSize(fw.size)}</span>
      </a>
    `;
          })
          .join('');

  // Reset file input
  firmwareFileInput.value = '';
  fileInputText.textContent = '📁 Вибрати .bin файл';
  fileInputText.classList.remove('selected');

  clearLog();
  flashLog.classList.remove('active');
  flashProgress.style.display = 'none';
  updateProgress(0, 'Готово до прошивки');

  flashBtn.disabled = true;
  flashBtn.textContent = '🔌 Підключити та прошити';
  cancelBtn.textContent = 'Скасувати';

  flashModal.classList.add('active');
}

// Handle file selection
function onFileSelected(input) {
  const file = input.files[0];
  if (!file) {
    selectedFileData = null;
    fileInputText.textContent = '📁 Вибрати .bin файл';
    fileInputText.classList.remove('selected');
    flashBtn.disabled = true;
    return;
  }

  if (!file.name.endsWith('.bin')) {
    alert('Будь ласка, виберіть файл з розширенням .bin');
    input.value = '';
    return;
  }

  fileInputText.textContent = `✅ ${file.name}`;
  fileInputText.classList.add('selected');

  // Read file
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedFileData = new Uint8Array(e.target.result);
    flashBtn.disabled = false;
    log(`Файл вибрано: ${file.name} (${formatSize(selectedFileData.length)})`,
        'success');
    flashLog.classList.add('active');
  };
  reader.onerror = () => {
    alert('Помилка читання файлу');
    selectedFileData = null;
    flashBtn.disabled = true;
  };
  reader.readAsArrayBuffer(file);
}

function closeFlashModal() {
  if (isFlashing) {
    if (!confirm('Прошивка в процесі. Ви впевнені, що хочете скасувати?')) {
      return;
    }
  }

  flashModal.classList.remove('active');

  // Disconnect port if connected
  if (port) {
    try {
      port.close();
    } catch (e) {
      console.error('Error closing port:', e);
    }
    port = null;
  }

  isFlashing = false;
  currentFirmware = null;
  currentVersion = null;
  selectedFileData = null;
}

// ESP Terminal class for esptool-js
class EspTerminal {
  clean() {
    // Clear terminal
  }

  writeLine(data) {
    log(data);
  }

  write(data) {
    // For continuous output
    const lastP = flashLog.lastElementChild;
    if (lastP && !lastP.textContent.includes('[')) {
      lastP.textContent += data;
    } else {
      const p = document.createElement('p');
      p.textContent = data;
      flashLog.appendChild(p);
    }
    flashLog.scrollTop = flashLog.scrollHeight;
  }
}

// Start flashing process
async function startFlash() {
  if (!selectedFileData) {
    alert('Помилка: спочатку виберіть файл прошивки');
    return;
  }

  if (!('serial' in navigator)) {
    alert(
        'Ваш браузер не підтримує Web Serial API. Використовуйте Chrome, Edge або Opera.');
    return;
  }

  isFlashing = true;
  flashBtn.disabled = true;
  flashBtn.textContent = 'Прошивка...';
  flashLog.classList.add('active');
  flashProgress.style.display = 'block';

  try {
    log('=== Початок прошивки ===', 'info');
    log(`Розмір файлу: ${formatSize(selectedFileData.length)}`, 'info');

    // Step 1: Connect to serial port
    updateProgress(10, 'Підключення до пристрою...');
    log('Виберіть COM-порт у діалоговому вікні...');

    port = await navigator.serial.requestPort();
    // Don't open port manually - esptool-js Transport handles it

    log('Порт вибрано!', 'success');

    // Step 2: Initialize ESP loader
    updateProgress(20, 'Ініціалізація ESP32...');
    log('Ініціалізація ESP32...');

    espLoaderTerminal = new EspTerminal();

    // Check if EspLoader is available
    if (typeof window.EspLoader === 'undefined' ||
        typeof window.Transport === 'undefined') {
      throw new Error('ESPTool не завантажено. Будь ласка, оновіть сторінку.');
    }

    const transport = new window.Transport(port);
    const loaderOptions = {
      transport: transport,
      baudrate: 115200,
      terminal: espLoaderTerminal,
      romBaudrate: 115200,
      enableTracing: false
    };

    const esploader = new window.EspLoader(loaderOptions);

    // Enter bootloader mode
    log('Перехід в режим завантажувача...');
    await esploader.main();

    log(`Виявлено чіп: ${esploader.chipName}`, 'success');

    updateProgress(35, 'Підготовка до запису...');

    // Step 3: Flash firmware
    updateProgress(40, 'Запис прошивки...');
    log('Запис прошивки...');

    // Convert Uint8Array to binary string (required by esptool-js)
    const binaryString = Array.from(selectedFileData)
                             .map(byte => String.fromCharCode(byte))
                             .join('');

    const flashOptions = {
      fileArray: [{
        data: binaryString,
        address: 0x0  // For merged binary, start at 0
      }],
      flashSize: 'keep',
      flashMode: 'keep',
      flashFreq: 'keep',
      eraseAll: false,
      compress: true,
      reportProgress: (fileIndex, written, total) => {
        const percent = Math.round((written / total) * 55) + 40;  // 40-95%
        updateProgress(
            percent, `Запис: ${formatSize(written)} / ${formatSize(total)}`);
      }
    };

    await esploader.writeFlash(flashOptions);

    // Step 4: Reset device
    updateProgress(95, 'Перезапуск пристрою...');
    log('Перезапуск пристрою...');

    await esploader.hardReset();

    // Done!
    updateProgress(100, '✅ Прошивка успішно завершена!');
    setProgressState('success', '✅ Прошивка успішно завершена!');
    log('=== Прошивка успішно завершена! ===', 'success');

    flashBtn.textContent = '✅ Готово!';
    cancelBtn.textContent = 'Закрити';

  } catch (error) {
    console.error('Flash error:', error);
    log(`Помилка: ${error.message}`, 'error');
    setProgressState('error', `❌ Помилка: ${error.message}`);

    flashBtn.disabled = false;
    flashBtn.textContent = '🔄 Спробувати знову';
  } finally {
    isFlashing = false;

    // Close port
    if (port) {
      try {
        await port.close();
      } catch (e) {
        console.error('Error closing port:', e);
      }
      port = null;
    }
  }
}

// Create release card HTML
function createReleaseCard(release, isLatest) {
  const card = document.createElement('div');
  card.className = `release-card${isLatest ? ' latest' : ''}`;

  const firmwareList = findAllMergedFirmware(release.assets);
  const hasWebSerial = window.isSecureContext && ('serial' in navigator);

  let installButton = '';
  if (firmwareList.length > 0 && hasWebSerial) {
    // Store firmware data in a global map
    const firmwareId = `firmware_${release.id}`;
    window[firmwareId] = firmwareList;

    installButton = `
            <button class="install-btn" onclick="openFlashModal('${
        release.tag_name}', window.${firmwareId})">
                ⚡ Встановити
            </button>
        `;
  } else if (firmwareList.length > 0 && !hasWebSerial) {
    installButton =
        `<button class="install-btn" disabled title="Браузер не підтримує Web Serial">Браузер не підтримується</button>`;
  } else {
    installButton =
        `<button class="install-btn" disabled>Бінарний файл не знайдено</button>`;
  }

  const assetsHtml =
      release.assets
          .filter(a => a.name.endsWith('.bin') || a.name.endsWith('.zip'))
          .map(
              a => `
            <a href="${a.browser_download_url}" class="asset-link" title="${
                  formatSize(a.size)}">
                📁 ${a.name}
            </a>
        `).join('');

  card.innerHTML = `
        <div class="release-header">
            <div class="release-info">
                <h3><a href="${release.html_url}" target="_blank">${
      release.name || release.tag_name}</a></h3>
                <span class="release-date">📅 ${
      formatDate(release.published_at)}</span>
            </div>
            <div class="release-actions">
                ${installButton}
            </div>
        </div>
        ${
      release.body ?
          `<div class="release-body">${parseMarkdown(release.body)}</div>` :
          ''}
        ${assetsHtml ? `<div class="release-assets">${assetsHtml}</div>` : ''}
    `;

  return card;
}

// Fetch and display releases
async function fetchReleases() {
  try {
    const response = await fetch(GITHUB_API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const releases = await response.json();

    loadingEl.style.display = 'none';

    if (releases.length === 0) {
      releasesList.innerHTML = `
                <div class="error-message">
                    <p>Релізів поки немає. Перевірте <a href="https://github.com/${
          GITHUB_REPO}/releases" target="_blank">GitHub репозиторій</a>.</p>
                </div>
            `;
      return;
    }

    releases.forEach((release, index) => {
      const card = createReleaseCard(release, index === 0);
      releasesList.appendChild(card);
    });

  } catch (error) {
    console.error('Error fetching releases:', error);
    loadingEl.style.display = 'none';
    releasesList.innerHTML = `
            <div class="error-message">
                <p>Помилка завантаження релізів: ${error.message}</p>
                <p>Спробуйте <a href="https://github.com/${
        GITHUB_REPO}/releases" target="_blank">відкрити GitHub напряму</a>.</p>
            </div>
        `;
  }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && flashModal.classList.contains('active')) {
    closeFlashModal();
  }
});

// Close modal on backdrop click
flashModal.addEventListener('click', (e) => {
  if (e.target === flashModal) {
    closeFlashModal();
  }
});

// Check if ESPTool is loaded
function checkEsptoolLoaded() {
  if (window.esptoolLoaded) {
    console.log('ESPTool loaded successfully');
    return true;
  }
  console.log('Waiting for ESPTool to load...');
  return false;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkWebSerialSupport();
  fetchReleases();

  // Check esptool status
  if (!checkEsptoolLoaded()) {
    window.addEventListener('esptool-loaded', () => {
      console.log('ESPTool loaded event received');
    });
  }
});
