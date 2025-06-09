import { MathUtils } from '../utils/MathUtils.js';

/**
 * Kullanıcı girdilerini yöneten sınıf
 */
export class InputController {
    constructor() {
        // Tuş durumları
        this.keys = {
            forward: false,    // W, ↑
            backward: false,   // S, ↓
            left: false,       // A, ←
            right: false,      // D, →
            brake: false       // Space
        };
        
        // Tuş haritası
        this.keyMap = {
            // İleri hareket
            'KeyW': 'forward',
            'ArrowUp': 'forward',
            
            // Geri hareket
            'KeyS': 'backward',
            'ArrowDown': 'backward',
            
            // Sol hareket
            'KeyA': 'left',
            'ArrowLeft': 'left',
            
            // Sağ hareket
            'KeyD': 'right',
            'ArrowRight': 'right',
            
            // El freni
            'Space': 'brake'
        };
        
        // Mouse/Touch desteği için
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false
        };
        
        this.touch = {
            x: 0,
            y: 0,
            isActive: false
        };
        
        // Gamepad desteği
        this.gamepad = null;
        this.gamepadConnected = false;
        
        this.init();
    }
    
    /**
     * Input controller'ı başlat
     */
    init() {
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupTouchEvents();
        this.setupGamepadEvents();
        
        console.log('🎮 Input Controller başlatıldı');
    }
    
    /**
     * Klavye event'lerini ayarla
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            this.onKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.onKeyUp(event);
        });
        
        // Context menu'yu engelle (sağ tık)
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    /**
     * Mouse event'lerini ayarla
     */
    setupMouseEvents() {
        document.addEventListener('mousedown', (event) => {
            this.onMouseDown(event);
        });
        
        document.addEventListener('mouseup', (event) => {
            this.onMouseUp(event);
        });
        
        document.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });
    }
    
    /**
     * Touch event'lerini ayarla (mobil destek)
     */
    setupTouchEvents() {
        document.addEventListener('touchstart', (event) => {
            this.onTouchStart(event);
        });
        
        document.addEventListener('touchend', (event) => {
            this.onTouchEnd(event);
        });
        
        document.addEventListener('touchmove', (event) => {
            this.onTouchMove(event);
        });
    }
    
    /**
     * Gamepad event'lerini ayarla
     */
    setupGamepadEvents() {
        window.addEventListener('gamepadconnected', (event) => {
            this.onGamepadConnected(event);
        });
        
        window.addEventListener('gamepaddisconnected', (event) => {
            this.onGamepadDisconnected(event);
        });
    }
    
    /**
     * Tuşa basıldığında
     */
    onKeyDown(event) {
        const action = this.keyMap[event.code];
        if (action && !this.keys[action]) {
            this.keys[action] = true;
            event.preventDefault();
        }
    }
    
    /**
     * Tuş bırakıldığında
     */
    onKeyUp(event) {
        const action = this.keyMap[event.code];
        if (action) {
            this.keys[action] = false;
            event.preventDefault();
        }
    }
    
    /**
     * Mouse basıldığında
     */
    onMouseDown(event) {
        this.mouse.isDown = true;
        this.updateMousePosition(event);
    }
    
    /**
     * Mouse bırakıldığında
     */
    onMouseUp(event) {
        this.mouse.isDown = false;
        this.updateMousePosition(event);
    }
    
    /**
     * Mouse hareket ettiğinde
     */
    onMouseMove(event) {
        this.updateMousePosition(event);
    }
    
    /**
     * Mouse pozisyonunu güncelle
     */
    updateMousePosition(event) {
        const rect = event.target.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    /**
     * Touch başladığında
     */
    onTouchStart(event) {
        event.preventDefault();
        this.touch.isActive = true;
        this.updateTouchPosition(event.touches[0]);
    }
    
    /**
     * Touch bittiğinde
     */
    onTouchEnd(event) {
        event.preventDefault();
        this.touch.isActive = false;
    }
    
    /**
     * Touch hareket ettiğinde
     */
    onTouchMove(event) {
        event.preventDefault();
        if (this.touch.isActive) {
            this.updateTouchPosition(event.touches[0]);
        }
    }
    
    /**
     * Touch pozisyonunu güncelle
     */
    updateTouchPosition(touch) {
        const rect = touch.target.getBoundingClientRect();
        this.touch.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        this.touch.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    /**
     * Gamepad bağlandığında
     */
    onGamepadConnected(event) {
        this.gamepad = event.gamepad;
        this.gamepadConnected = true;
        console.log('🎮 Gamepad bağlandı:', this.gamepad.id);
    }
    
    /**
     * Gamepad bağlantısı kesildiğinde
     */
    onGamepadDisconnected(event) {
        this.gamepad = null;
        this.gamepadConnected = false;
        console.log('🎮 Gamepad bağlantısı kesildi');
    }
    
    /**
     * Input'ları güncelle
     */
    update() {
        // Gamepad input'larını kontrol et
        if (this.gamepadConnected) {
            this.updateGamepadInputs();
        }
        
        // Touch input'larını klavye input'larına çevir (mobil destek)
        if (this.touch.isActive) {
            this.processTouchInputs();
        }
    }
    
    /**
     * Gamepad input'larını güncelle
     */
    updateGamepadInputs() {
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0]; // İlk gamepad'i kullan
        
        if (gamepad) {
            // Analog stickler
            const leftStickX = gamepad.axes[0];
            const leftStickY = gamepad.axes[1];
            const threshold = 0.2; // Dead zone
            
            // Sol stick ile hareket kontrolü
            this.keys.left = leftStickX < -threshold;
            this.keys.right = leftStickX > threshold;
            this.keys.forward = leftStickY < -threshold;
            this.keys.backward = leftStickY > threshold;
            
            // Butonlar
            this.keys.brake = gamepad.buttons[0].pressed; // A butonu (Xbox)
        }
    }
    
    /**
     * Touch input'larını işle
     */
    processTouchInputs() {
        // Touch pozisyonuna göre basit kontrol
        // Ekranın sol yarısı yön kontrolü, sağ yarısı gaz/fren
        if (this.touch.x < 0) {
            // Sol yarı - yön kontrolü
            this.keys.left = this.touch.x < -0.5;
            this.keys.right = false;
        } else {
            // Sağ yarı - gaz/fren
            this.keys.forward = this.touch.y > 0;
            this.keys.backward = this.touch.y < 0;
        }
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
     * Input durumlarını güncelle
     */
    updateInputStates() {
        // Temel hareket kontrolleri
        this.inputState.forward = this.keys['KeyW'] || this.keys['ArrowUp'] || false;
        this.inputState.backward = this.keys['KeyS'] || this.keys['ArrowDown'] || false;
        this.inputState.left = this.keys['KeyA'] || this.keys['ArrowLeft'] || false;
        this.inputState.right = this.keys['KeyD'] || this.keys['ArrowRight'] || false;
    }
}
