import * as THREE from 'three';
import { Vehicle } from '../vehicle/Vehicle.js';
import { Road } from '../world/Road.js';
import { Environment } from '../world/Environment.js';
import { InputController } from '../controls/InputController.js';
import { CameraController } from '../camera/CameraController.js';
import { UIManager } from '../ui/UIManager.js';

/**
 * Ana oyun motoru - tüm sistemleri yönetir
 */
export class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        
        // Oyun nesneleri
        this.vehicle = null;
        this.road = null;
        this.environment = null;
        this.inputController = null;
        this.cameraController = null;
        this.uiManager = null;
        
        // Oyun durumu
        this.isRunning = false;
        this.isPaused = false;
        this.gameSpeed = 1.0;
        
        // Input durumu - EKLENDİ
        this.lastCameraToggle = false;
        
        // Performans
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.fps = 0;
        this.fpsCounter = 0;
        this.fpsTimer = 0;
        
        // Oyun ayarları
        this.settings = {
            graphics: {
                antialias: true,
                shadows: true,
                fog: true
            },
            physics: {
                gravity: -9.81,
                friction: 0.8
            },
            camera: {
                fov: 75,
                near: 0.1,
                far: 1000
            }
        };
        
        this.init();
    }
    
    /**
     * Oyun motorunu başlat
     */
    async init() {
        try {
            console.log('🎮 Oyun motoru başlatılıyor...');
            
            this.setupRenderer();
            this.setupScene();
            this.setupCamera();
            this.setupLighting();
            
            // Oyun sistemlerini başlat
            await this.initializeSystems();
            
            // Event listener'ları ekle
            this.setupEventListeners();
            
            console.log('✅ Oyun motoru başarıyla başlatıldı');
            
            // Oyunu başlat
            this.startGame();
            
        } catch (error) {
            console.error('❌ Oyun motoru başlatılamadı:', error);
        }
    }
    
    /**
     * Renderer'ı ayarla
     */
    setupRenderer() {
        this.canvas = document.getElementById('game-canvas');
        
        // Canvas elementinin varlığını kontrol et
        if (!this.canvas) {
            throw new Error('Canvas element bulunamadı! ID: game-canvas');
        }
        
        console.log('🎨 Canvas elementi bulundu:', this.canvas);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.settings.graphics.antialias,
            alpha: false,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Canvas'ı focusable yap
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
        
        // Canvas'a tıklandığında focus al
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
            console.log('🎯 Canvas focus aldı');
        });
        
        // Gölge ayarları
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Renk ayarları
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.gammaFactor = 2.2;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        
        // Arka plan rengi
        this.renderer.setClearColor(0x87CEEB, 1.0);
        
        console.log('🎨 Gelişmiş renderer ayarlandı');
    }
    
    /**
     * 3D sahneyi ayarla
     */
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Arka plan rengi - gökyüzü mavisi
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Sis efekti
        if (this.settings.graphics.fog) {
            this.scene.fog = new THREE.Fog(0x87CEEB, 50, 300);
        }
        
        console.log('🌍 Sahne oluşturuldu');
    }
    
    /**
     * Kamerayı ayarla
     */
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            this.settings.camera.fov,
            window.innerWidth / window.innerHeight,
            this.settings.camera.near,
            this.settings.camera.far
        );
        
        this.camera.position.set(0, 5, 10);
        
        console.log('📷 Kamera ayarlandı');
    }
    
    /**
     * Aydınlatmayı ayarla
     */
    setupLighting() {
        // Ana güneş ışığı - daha güçlü ve daha iyi konumlandırılmış
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Gölge ayarları - daha geniş alan
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 300;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.bias = -0.0001;
        
        this.scene.add(directionalLight);
        
        // Çevresel ışık - daha güçlü
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Ek dolgu ışığı - gölgeleri yumuşatmak için
        const fillLight = new THREE.DirectionalLight(0x8bb7f0, 0.4);
        fillLight.position.set(-30, 50, -30);
        this.scene.add(fillLight);
        
        // Arka plan ışığı
        const backLight = new THREE.DirectionalLight(0xfff4e6, 0.3);
        backLight.position.set(0, 20, -50);
        this.scene.add(backLight);
        
        console.log('💡 Gelişmiş aydınlatma ayarlandı');
    }
    
    /**
     * Oyun sistemlerini başlat
     */
    async initializeSystems() {
        // Input controller
        this.inputController = new InputController();
        
        // Araç oluştur
        this.vehicle = new Vehicle(this.scene);
        
        // Yol oluştur
        this.road = new Road(this.scene);
        
        // Çevre oluştur
        this.environment = new Environment(this.scene);
        
        // Kamera controller
        this.cameraController = new CameraController(this.camera, this.vehicle);
        
        // UI Manager
        this.uiManager = new UIManager();
        
        console.log('🔧 Oyun sistemleri başlatıldı');
    }
    
    /**
     * Event listener'ları ayarla
     */
    setupEventListeners() {
        // Pencere boyutu değişikliği
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Oyun odaklanma/odaktan çıkma
        window.addEventListener('focus', () => this.onGameFocus());
        window.addEventListener('blur', () => this.onGameBlur());
        
        console.log('🎛️ Event listener\'lar ayarlandı');
    }
    
    /**
     * Oyunu başlat
     */
    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        
        // Yükleme ekranını gizle, UI'yi göster
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('ui').classList.remove('hidden');
        
        // Ana oyun döngüsünü başlat
        this.gameLoop();
        
        console.log('🚀 Oyun başlatıldı');
    }
    
    /**
     * Ana oyun döngüsü
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Delta time hesapla
        this.deltaTime = this.clock.getDelta() * this.gameSpeed;
        
        // FPS hesapla
        this.calculateFPS();
        
        // Oyun paused değilse güncelle
        if (!this.isPaused) {
            this.update();
        }
        
        // Render et
        this.render();
        
        // Bir sonraki frame'i planla
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Oyun nesnelerini güncelle
     */
    update() {
        // Input controller'ı güncelle
        this.inputController.update();
        
        // Input state'i al
        const inputState = this.inputController.getInputState();
        
        // Kamera değiştirme kontrolü
        if (inputState.cameraToggle && !this.lastCameraToggle) {
            this.cameraController.switchMode();
            console.log('📷 Kamera modu değişti');
        }
        this.lastCameraToggle = inputState.cameraToggle;
        
        // DEBUG - Input'ları kontrol et
        if (inputState.forward || inputState.backward || inputState.left || inputState.right) {
            console.log('🎮 GameEngine Input:', inputState);
        }
        
        // Araç güncelle - deltaTime'ı burada geç
        this.vehicle.update(this.deltaTime, inputState);
        
        // Yol güncelle
        this.road.update(this.vehicle.getPosition());
        
        // Çevre güncelle
        this.environment.update(this.deltaTime);
        
        // Kamera güncelle
        this.cameraController.update(this.deltaTime);
        
        // UI güncelle
        this.uiManager.update(this.vehicle, this.fps);
    }
    
    /**
     * Sahneyi render et
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * FPS hesapla
     */
    calculateFPS() {
        this.fpsCounter++;
        this.fpsTimer += this.deltaTime;
        
        if (this.fpsTimer >= 1.0) {
            this.fps = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTimer = 0;
        }
    }
    
    /**
     * Pencere boyutu değiştiğinde
     */
    onWindowResize() {
        // Kamera aspect ratio'sunu güncelle
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Renderer boyutunu güncelle
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        console.log('📐 Pencere boyutu güncellendi');
    }
    
    /**
     * Oyun odaklandığında
     */
    onGameFocus() {
        if (this.isRunning && this.isPaused) {
            this.resumeGame();
        }
    }
    
    /**
     * Oyun odaktan çıktığında
     */
    onGameBlur() {
        if (this.isRunning && !this.isPaused) {
            this.pauseGame();
        }
    }
    
    /**
     * Oyunu duraklat
     */
    pauseGame() {
        this.isPaused = true;
        this.clock.stop();
        console.log('⏸️ Oyun duraklatıldı');
    }
    
    /**
     * Oyunu devam ettir
     */
    resumeGame() {
        this.isPaused = false;
        this.clock.start();
        console.log('▶️ Oyun devam ettirildi');
    }
    
    /**
     * Oyunu durdur
     */
    stopGame() {
        this.isRunning = false;
        this.isPaused = false;
        console.log('⏹️ Oyun durduruldu');
    }
    
    /**
     * Kaynakları temizle
     */
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Diğer kaynakları da temizle...
        console.log('🗑️ Kaynaklar temizlendi');
    }
}
