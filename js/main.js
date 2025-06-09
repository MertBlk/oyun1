/**
 * Ana oyun başlatma dosyası
 */

// Three.js ve oyun modüllerini import et
import * as THREE from 'three';

// Oyun sınıflarını import et
import { GameEngine } from './core/GameEngine.js';
import { Vehicle } from './vehicle/Vehicle.js';
import { Road } from './world/Road.js';
import { Environment } from './world/Environment.js';
import { InputController } from './controls/InputController.js';
import { CameraController } from './camera/CameraController.js';
import { UIManager } from './ui/UIManager.js';
import { MathUtils } from './utils/MathUtils.js';

console.log('🎯 Main.js yüklendi');
console.log('🔍 THREE.js:', typeof THREE);

// Three.js'i global olarak tanımla
window.THREE = THREE;

// Global oyun nesnesi
let game = null;

/**
 * Oyunu başlat
 */
function initGame() {
    console.log('🎮 Oyun başlatılıyor...');
    
    // DOM'un tamamen yüklendiğinden emin ol
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM yüklendi, oyun başlatılıyor...');
            startGameEngine();
        });
    } else {
        console.log('📄 DOM zaten yüklü, oyun başlatılıyor...');
        startGameEngine();
    }
}

/**
 * Oyun motorunu başlat
 */
function startGameEngine() {
    try {
        // Canvas elementinin varlığını kontrol et
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            throw new Error('Canvas element bulunamadı!');
        }
        
        console.log('🎨 Canvas elementi bulundu, oyun motoru başlatılıyor...');
        
        // Oyun motorunu başlat
        const gameEngine = new GameEngine();
        
        // Global erişim için (debug amaçlı)
        window.gameEngine = gameEngine;
        
    } catch (error) {
        console.error('❌ Oyun başlatılamadı:', error);
        
        // Hata mesajını kullanıcıya göster
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="loading-content">
                    <h2>❌ Oyun Yüklenemedi</h2>
                    <p>Hata: ${error.message}</p>
                    <button onclick="location.reload()">🔄 Tekrar Dene</button>
                </div>
            `;
        }
    }
}

/**
 * Browser uyumluluğunu kontrol et
 */
function checkBrowserCompatibility() {
    // WebGL desteği
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
        console.error('WebGL desteklenmiyor');
        return false;
    }
    
    // Gerekli API'ları kontrol et
    const requiredAPIs = [
        'requestAnimationFrame',
        'addEventListener'
    ];
    
    for (const api of requiredAPIs) {
        if (!(api in window)) {
            console.error(`${api} desteklenmiyor`);
            return false;
        }
    }
    
    // Document API'larını kontrol et
    if (!document.querySelector) {
        console.error('querySelector desteklenmiyor');
        return false;
    }
    
    return true;
}

/**
 * Hata mesajı göster
 */
function showError(message) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.innerHTML = `
            <h2 style="color: #ff4444;">Hata!</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: #ff4444;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">Sayfayı Yenile</button>
        `;
    }
}

/**
 * Oyunu duraklat/devam ettir
 */
function togglePause() {
    if (game) {
        if (game.isPaused) {
            game.resumeGame();
        } else {
            game.pauseGame();
        }
    }
}

/**
 * Oyunu yeniden başlat
 */
function restartGame() {
    if (game) {
        // Aracı sıfırla
        if (game.vehicle) {
            game.vehicle.reset();
        }
        
        // UI'yi sıfırla
        if (game.uiManager) {
            game.uiManager.reset();
        }
        
        // Kamerayı sıfırla
        if (game.cameraController) {
            game.cameraController.setCameraMode('third_person');
        }
        
        console.log('🔄 Oyun yeniden başlatıldı');
    }
}

/**
 * Oyun ayarlarını değiştir
 */
function changeGameSettings(settings) {
    if (game) {
        // Graphics ayarları
        if (settings.graphics) {
            Object.assign(game.settings.graphics, settings.graphics);
            
            // Gölgeleri aç/kapat
            if ('shadows' in settings.graphics) {
                game.renderer.shadowMap.enabled = settings.graphics.shadows;
            }
            
            // Sis efektini aç/kapat
            if ('fog' in settings.graphics) {
                if (settings.graphics.fog) {
                    game.scene.fog = new THREE.Fog(0x87CEEB, 50, 300);
                } else {
                    game.scene.fog = null;
                }
            }
        }
        
        // UI ayarları
        if (settings.ui && game.uiManager) {
            game.uiManager.updateSettings(settings.ui);
        }
        
        console.log('⚙️ Oyun ayarları güncellendi:', settings);
    }
}

/**
 * Performans modunu aç/kapat
 */
function togglePerformanceMode() {
    if (game) {
        const isPerformanceMode = !game.settings.graphics.shadows;
        
        changeGameSettings({
            graphics: {
                shadows: !isPerformanceMode,
                fog: !isPerformanceMode,
                antialias: !isPerformanceMode
            }
        });
        
        const mode = isPerformanceMode ? 'Kalite' : 'Performans';
        if (game.uiManager) {
            game.uiManager.showNotification(`${mode} moduna geçildi`, 2000, 'info');
        }
    }
}

/**
 * Screenshot al
 */
function takeScreenshot() {
    if (game && game.renderer) {
        const link = document.createElement('a');
        link.download = `araba-oyunu-${Date.now()}.png`;
        link.href = game.renderer.domElement.toDataURL();
        link.click();
        
        if (game.uiManager) {
            game.uiManager.showNotification('Ekran görüntüsü alındı!', 2000, 'success');
        }
    }
}

/**
 * Debug bilgilerini göster
 */
function toggleDebugInfo() {
    if (game) {
        // Debug panel oluştur/göster
        let debugPanel = document.getElementById('debug-panel');
        
        if (!debugPanel) {
            debugPanel = document.createElement('div');
            debugPanel.id = 'debug-panel';
            debugPanel.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 1000;
                min-width: 200px;
            `;
            document.body.appendChild(debugPanel);
        } else {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        }
        
        // Debug bilgilerini güncelle
        if (debugPanel.style.display !== 'none') {
            updateDebugInfo();
        }
    }
}

/**
 * Debug bilgilerini güncelle
 */
function updateDebugInfo() {
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel && game) {
        const vehicle = game.vehicle;
        const renderer = game.renderer;
        
        debugPanel.innerHTML = `
            <h4>Debug Bilgileri</h4>
            <hr>
            <strong>Araç:</strong><br>
            Pozisyon: ${vehicle ? vehicle.position.x.toFixed(1) : 0}, ${vehicle ? vehicle.position.z.toFixed(1) : 0}<br>
            Hız: ${vehicle ? vehicle.getSpeed().toFixed(1) : 0} km/h<br>
            Rotasyon: ${vehicle ? (vehicle.rotation.y * 180 / Math.PI).toFixed(1) : 0}°<br>
            <br>
            <strong>Performans:</strong><br>
            FPS: ${Math.round(game.fps)}<br>
            Delta: ${game.deltaTime.toFixed(3)}s<br>
            <br>
            <strong>Render:</strong><br>
            Triangles: ${renderer.info.render.triangles}<br>
            Calls: ${renderer.info.render.calls}<br>
            <br>
            <strong>Kamera:</strong><br>
            Mod: ${game.cameraController ? game.cameraController.getCurrentMode() : 'N/A'}<br>
            <br>
            <strong>Kontroller:</strong><br>
            <small>C: Kamera modu<br>
            H: Talimatlar<br>
            U: UI gizle<br>
            F11: Tam ekran<br>
            P: Performans modu</small>
        `;
        
        // Sürekli güncelle
        setTimeout(updateDebugInfo, 100);
    }
}

/**
 * Global klavye kısayolları
 */
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyP':
            togglePerformanceMode();
            event.preventDefault();
            break;
            
        case 'KeyR':
            if (event.ctrlKey) {
                restartGame();
                event.preventDefault();
            }
            break;
            
        case 'F12':
            toggleDebugInfo();
            event.preventDefault();
            break;
            
        case 'F9':
            takeScreenshot();
            event.preventDefault();
            break;
            
        case 'Escape':
            togglePause();
            event.preventDefault();
            break;
    }
});

/**
 * Pencere kapanırken temizlik yap
 */
window.addEventListener('beforeunload', () => {
    if (game) {
        game.dispose();
    }
});

/**
 * Hata yakalama
 */
window.addEventListener('error', (event) => {
    console.error('Global hata:', event.error);
    
    if (game && game.uiManager) {
        game.uiManager.showNotification(
            'Bir hata oluştu. Konsolu kontrol edin.',
            5000,
            'error'
        );
    }
});

/**
 * WebGL context kaybı
 */
document.addEventListener('webglcontextlost', (event) => {
    console.warn('WebGL context kayboldu');
    event.preventDefault();
    
    if (game && game.uiManager) {
        game.uiManager.showNotification(
            'Grafik kartı bağlantısı kesildi. Sayfa yenileniyor...',
            3000,
            'warning'
        );
        
        setTimeout(() => {
            location.reload();
        }, 3000);
    }
});

// Sayfa yüklendiğinde oyunu başlat
console.log('🔧 Script yüklendi, sayfa durumu:', document.readyState);

if (document.readyState === 'loading') {
    console.log('📄 DOM yükleniyor, event listener ekleniyor...');
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // Sayfa zaten yüklenmiş
    console.log('📄 DOM zaten hazır, oyunu başlatıyoruz...');
    initGame();
}
