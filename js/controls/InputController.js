import { MathUtils } from '../utils/MathUtils.js';

/**
 * Oyun input'larını yönetir (klavye, mouse)
 */
export class InputController {
    constructor() {
        this.keys = {}; // Basılan tuşları sakla
        this.inputState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            handbrake: false,
            cameraToggle: false,
            reset: false,
            pause: false
        };
        
        this.setupEventListeners();
        console.log('🎮 Input Controller başlatıldı');
    }
    
    /**
     * Event listener'ları ayarla
     */
    setupEventListeners() {
        // Keydown event'i
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // DEBUG - Basılan tuşu göster
            console.log('🔽 Tuş basıldı:', event.code);
            
            // Varsayılan davranışları engelle (scroll vs.)
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                event.preventDefault();
            }
        });
        
        // Keyup event'i
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
            
            // DEBUG - Bırakılan tuşu göster
            console.log('🔼 Tuş bırakıldı:', event.code);
        });
        
        // Sayfa değiştiğinde tuşları temizle
        document.addEventListener('blur', () => {
            this.keys = {};
            console.log('🔄 Tuşlar temizlendi (sayfa odağı kaybı)');
        });
        
        console.log('🎮 Event listener\'lar ayarlandı');
    }
    
    /**
     * Belirli bir tuşun basılı olup olmadığını kontrol et
     */
    isKeyPressed(key) {
        return this.keys[key] || false;
    }
    
    /**
     * İleri hareket input'u
     */
    getForwardInput() {
        let input = 0;
        if (this.keys.forward) input += 1;
        if (this.keys.backward) input -= 1;
        return MathUtils.clamp(input, -1, 1);
    }
    
    /**
     * Yanlara hareket input'u
     */
    getSideInput() {
        let input = 0;
        if (this.keys.right) input += 1;
        if (this.keys.left) input -= 1;
        return MathUtils.clamp(input, -1, 1);
    }
    
    /**
     * Fren input'u
     */
    getBrakeInput() {
        return this.keys.brake ? 1 : 0;
    }
    
    /**
     * Mouse pozisyonu al (normalized -1 to 1)
     */
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    /**
     * Touch pozisyonu al (normalized -1 to 1)
     */
    getTouchPosition() {
        return { x: this.touch.x, y: this.touch.y };
    }
    
    /**
     * Tüm input'ları sıfırla
     */
    reset() {
        for (let key in this.keys) {
            this.keys[key] = false;
        }
        
        this.mouse.isDown = false;
        this.touch.isActive = false;
    }
    
    /**
     * Input controller'ı güncelle
     */
    update() {
        this.updateInputStates();
    }
    
    /**
     * Input durumlarını güncelle
     */
    updateInputStates() {
        // Temel hareket kontrolleri
        this.inputState.forward = this.keys['KeyW'] || this.keys['ArrowUp'] || false;
        this.inputState.backward = this.keys['KeyS'] || this.keys['ArrowDown'] || false;
        this.inputState.left = this.keys['KeyA'] || this.keys['ArrowLeft'] || false;
        this.inputState.right = this.keys['KeyD'] || this.keys['ArrowRight'] || false;
        
        // Diğer kontroller
        this.inputState.handbrake = this.keys['Space'] || false;
        this.inputState.cameraToggle = this.keys['KeyC'] || false;
        this.inputState.reset = this.keys['KeyR'] || false;
        this.inputState.pause = this.keys['KeyP'] || false;
        
        // DEBUG - Input'ları konsola yazdır
        if (this.inputState.forward || this.inputState.backward || this.inputState.left || this.inputState.right) {
            console.log('🎮 Input State:', {
                forward: this.inputState.forward,
                backward: this.inputState.backward,
                left: this.inputState.left,
                right: this.inputState.right,
                keys: Object.keys(this.keys).filter(key => this.keys[key])
            });
        }
    }
    
    /**
     * Input state'i al
     */
    getInputState() {
        return { ...this.inputState }; // Copy return et
    }
}
