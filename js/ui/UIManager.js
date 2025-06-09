import { MathUtils } from '../utils/MathUtils.js';

/**
 * Kullanıcı arayüzü yönetimi
 */
export class UIManager {
    constructor() {
        // UI elementleri
        this.elements = {
            speedometer: document.getElementById('speed'),
            instructions: document.getElementById('instructions'),
            ui: document.getElementById('ui'),
            loading: document.getElementById('loading')
        };
        
        // UI durumu
        this.isVisible = true;
        this.currentSpeed = 0;
        this.maxRecordedSpeed = 0;
        
        // UI ayarları
        this.settings = {
            speedUnit: 'kmh', // 'kmh' veya 'mph'
            showInstructions: true,
            fadeOutDelay: 5000, // 5 saniye sonra talimatları gizle
            updateFrequency: 10 // FPS (her kaç frame'de bir güncelle)
        };
        
        // Güncelleme sayacı
        this.updateCounter = 0;
        this.instructionTimer = 0;
        
        // Animasyon elementleri
        this.speedAnimationTarget = 0;
        
        this.init();
        console.log('🖥️ UI Manager başlatıldı');
    }
    
    /**
     * UI Manager'ı başlat
     */
    init() {
        this.setupEventListeners();
        this.initializeElements();
        this.startInstructionTimer();
    }
    
    /**
     * Event listener'ları ayarla
     */
    setupEventListeners() {
        // Klavye kısayolları
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyH':
                    this.toggleInstructions();
                    event.preventDefault();
                    break;
                    
                case 'KeyU':
                    this.toggleUI();
                    event.preventDefault();
                    break;
                    
                case 'F11':
                    this.toggleFullscreen();
                    event.preventDefault();
                    break;
            }
        });
        
        // Pencere boyutu değişikliği
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Mouse hover efektleri
        if (this.elements.instructions) {
            this.elements.instructions.addEventListener('mouseenter', () => {
                this.pauseInstructionTimer();
            });
            
            this.elements.instructions.addEventListener('mouseleave', () => {
                this.resumeInstructionTimer();
            });
        }
    }
    
    /**
     * UI elementlerini başlat
     */
    initializeElements() {
        // Speedometer başlangıç değeri
        this.updateSpeedometer(0);
        
        // Fade-in efekti
        if (this.elements.ui) {
            this.elements.ui.style.opacity = '0';
            setTimeout(() => {
                this.elements.ui.style.transition = 'opacity 0.5s ease-in-out';
                this.elements.ui.style.opacity = '1';
            }, 500);
        }
    }
    
    /**
     * Talimat zamanlayıcısını başlat
     */
    startInstructionTimer() {
        if (this.settings.showInstructions) {
            this.instructionTimer = Date.now();
        }
    }
    
    /**
     * UI'yi güncelle
     */
    update(vehicle) {
        this.updateCounter++;
        
        // Belirli aralıklarla güncelle (performans için)
        if (this.updateCounter % this.settings.updateFrequency === 0) {
            this.updateSpeedometer(vehicle.getSpeed());
            this.updateOtherMetrics(vehicle);
        }
        
        // Talimatları otomatik gizle
        this.updateInstructionVisibility();
        
        // Hız animasyonu
        this.animateSpeedometer();
    }
    
    /**
     * Hız göstergesini güncelle
     */
    updateSpeedometer(speed) {
        this.speedAnimationTarget = speed;
        
        // Maksimum hızı kaydet
        if (speed > this.maxRecordedSpeed) {
            this.maxRecordedSpeed = speed;
        }
        
        // Hız rengini ayarla (hıza göre)
        this.updateSpeedColor(speed);
    }
    
    /**
     * Hız göstergesi animasyonu
     */
    animateSpeedometer() {
        if (this.elements.speedometer) {
            // Smooth geçiş
            this.currentSpeed = MathUtils.lerp(
                this.currentSpeed, 
                this.speedAnimationTarget, 
                0.1
            );
            
            // Display value
            const displaySpeed = Math.round(this.currentSpeed);
            const unit = this.settings.speedUnit === 'mph' ? 'mph' : 'km/h';
            
            this.elements.speedometer.textContent = `${displaySpeed} ${unit}`;
        }
    }
    
    /**
     * Hız rengini güncelle
     */
    updateSpeedColor(speed) {
        if (this.elements.speedometer) {
            let color = '#00ff88'; // Yeşil (normal)
            
            if (speed > 80) {
                color = '#ff4444'; // Kırmızı (çok hızlı)
            } else if (speed > 50) {
                color = '#ffaa00'; // Turuncu (hızlı)
            }
            
            this.elements.speedometer.style.color = color;
        }
    }
    
    /**
     * Diğer metrikleri güncelle
     */
    updateOtherMetrics(vehicle) {
        // Gelecekte daha fazla bilgi eklenebilir:
        // - Yakıt
        // - Motor RPM
        // - Gear
        // - Mini harita
        // - Zamanlama
    }
    
    /**
     * Talimat görünürlüğünü güncelle
     */
    updateInstructionVisibility() {
        if (this.settings.showInstructions && 
            this.elements.instructions && 
            this.instructionTimer > 0) {
            
            const elapsed = Date.now() - this.instructionTimer;
            
            if (elapsed > this.settings.fadeOutDelay) {
                this.fadeOutInstructions();
            }
        }
    }
    
    /**
     * Talimatları yavaşça gizle
     */
    fadeOutInstructions() {
        if (this.elements.instructions) {
            this.elements.instructions.style.transition = 'opacity 2s ease-out';
            this.elements.instructions.style.opacity = '0.3';
            this.instructionTimer = 0;
        }
    }
    
    /**
     * Talimatları göster/gizle
     */
    toggleInstructions() {
        if (this.elements.instructions) {
            const isVisible = this.elements.instructions.style.opacity !== '0';
            
            this.elements.instructions.style.transition = 'opacity 0.3s ease-in-out';
            this.elements.instructions.style.opacity = isVisible ? '0' : '1';
            
            if (!isVisible) {
                this.startInstructionTimer();
            }
        }
    }
    
    /**
     * Talimat zamanlayıcısını duraklat
     */
    pauseInstructionTimer() {
        this.instructionTimer = -1; // Pause işareti
    }
    
    /**
     * Talimat zamanlayıcısını devam ettir
     */
    resumeInstructionTimer() {
        if (this.instructionTimer === -1) {
            this.startInstructionTimer();
        }
    }
    
    /**
     * Tüm UI'yi göster/gizle
     */
    toggleUI() {
        this.isVisible = !this.isVisible;
        
        if (this.elements.ui) {
            this.elements.ui.style.transition = 'opacity 0.3s ease-in-out';
            this.elements.ui.style.opacity = this.isVisible ? '1' : '0';
        }
    }
    
    /**
     * Tam ekran geçişi
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Tam ekran modu desteklenmiyor:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    /**
     * Pencere boyutu değişikliğini handle et
     */
    handleResize() {
        // Responsive UI ayarlamaları
        const isMobile = window.innerWidth < 768;
        
        if (this.elements.instructions) {
            if (isMobile) {
                this.elements.instructions.style.fontSize = '12px';
                this.elements.instructions.style.maxWidth = '250px';
            } else {
                this.elements.instructions.style.fontSize = '14px';
                this.elements.instructions.style.maxWidth = '300px';
            }
        }
        
        if (this.elements.speedometer) {
            if (isMobile) {
                this.elements.speedometer.style.fontSize = '20px';
                this.elements.speedometer.style.padding = '10px';
            } else {
                this.elements.speedometer.style.fontSize = '24px';
                this.elements.speedometer.style.padding = '15px';
            }
        }
    }
    
    /**
     * Bildirim göster
     */
    showNotification(message, duration = 3000, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Stil
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            pointer-events: none;
        `;
        
        // Tip rengini ayarla
        switch (type) {
            case 'success':
                notification.style.borderLeft = '4px solid #00ff88';
                break;
            case 'warning':
                notification.style.borderLeft = '4px solid #ffaa00';
                break;
            case 'error':
                notification.style.borderLeft = '4px solid #ff4444';
                break;
            default:
                notification.style.borderLeft = '4px solid #4444ff';
        }
        
        document.body.appendChild(notification);
        
        // Animasyon
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);
        
        // Kaldır
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, duration);
    }
    
    /**
     * Loading ekranını göster
     */
    showLoading(message = 'Yükleniyor...') {
        if (this.elements.loading) {
            this.elements.loading.innerHTML = `
                <h2>${message}</h2>
                <div class="loading-spinner"></div>
            `;
            this.elements.loading.classList.remove('hidden');
        }
    }
    
    /**
     * Loading ekranını gizle
     */
    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.add('hidden');
        }
    }
    
    /**
     * UI ayarlarını güncelle
     */
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        // Değişiklikleri uygula
        if (newSettings.speedUnit) {
            this.updateSpeedometer(this.currentSpeed);
        }
    }
    
    /**
     * Performans istatistiklerini göster
     */
    showPerformanceStats(fps, drawCalls, triangles) {
        // Geliştirici modu için
        const statsElement = document.getElementById('performance-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                FPS: ${Math.round(fps)}<br>
                Draw Calls: ${drawCalls}<br>
                Triangles: ${triangles}
            `;
        }
    }
    
    /**
     * Maksimum hızı al
     */
    getMaxRecordedSpeed() {
        return this.maxRecordedSpeed;
    }
    
    /**
     * UI'yi sıfırla
     */
    reset() {
        this.currentSpeed = 0;
        this.maxRecordedSpeed = 0;
        this.updateSpeedometer(0);
        this.startInstructionTimer();
        
        if (this.elements.instructions) {
            this.elements.instructions.style.opacity = '1';
        }
    }
    
    /**
     * Kaynakları temizle
     */
    dispose() {
        // Event listener'ları kaldır
        // Animasyonları durdur
        // DOM elementlerini temizle
        
        console.log('🗑️ UI kaynakları temizlendi');
    }
}
