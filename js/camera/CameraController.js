import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Dinamik kamera kontrolü ve takip sistemi
 */
export class CameraController {
    constructor(camera, vehicle) {
        this.camera = camera;
        this.vehicle = vehicle;
        
        // Kamera modları
        this.modes = {
            THIRD_PERSON: 'third_person',
            FIRST_PERSON: 'first_person',
            CINEMATIC: 'cinematic',
            FREE: 'free'
        };
        
        this.currentMode = this.modes.THIRD_PERSON;
        
        // Kamera ayarları
        this.settings = {
            // Third person ayarları
            thirdPerson: {
                distance: 10,          // Araçtan uzaklık
                height: 4,             // Yükseklik
                angle: 0.1,            // Aşağı bakma açısı
                followSpeed: 8,        // Takip hızı
                rotationSpeed: 3,      // Rotasyon hızı
                offsetX: 0,            // Yan kayma
                lookAhead: 2           // İlerisine bakma mesafesi
            },
            
            // First person ayarları
            firstPerson: {
                height: 0.5,           // Araç içi yükseklik
                offsetZ: 1.0,          // Ön cam arkası
                lookAhead: 5           // İlerisine bakma
            },
            
            // Cinematic ayarları
            cinematic: {
                radius: 15,            // Dönüş yarıçapı
                speed: 0.5,            // Dönüş hızı
                height: 8,             // Yükseklik
                oscillation: 2         // Salınım
            }
        };
        
        // Kamera durumu
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        
        // Smoothing için
        this.velocity = new THREE.Vector3();
        this.lookAtVelocity = new THREE.Vector3();
        
        // Shake efekti
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        
        // Cinematic mod için
        this.cinematicTime = 0;
        this.cinematicCenter = new THREE.Vector3();
        
        // Kullanıcı kontrolü (mouse ile kamera dönüşü)
        this.mouseControl = {
            enabled: false,
            sensitivity: 0.002,
            pitch: 0,
            yaw: 0,
            maxPitch: Math.PI / 3
        };
        
        this.init();
        console.log('📷 Kamera kontrolcüsü başlatıldı');
    }
    
    /**
     * Kamera kontrolcüsünü başlat
     */
    init() {
        // Başlangıç pozisyonu
        this.updateTargetPositions();
        this.camera.position.copy(this.targetPosition);
        this.camera.lookAt(this.targetLookAt);
        this.currentLookAt.copy(this.targetLookAt);
        
        this.setupMouseControls();
    }
    
    /**
     * Mouse kontrollerini ayarla
     */
    setupMouseControls() {
        let isMouseDown = false;
        
        document.addEventListener('mousedown', (event) => {
            if (event.button === 2) { // Sağ tık
                isMouseDown = true;
                this.mouseControl.enabled = true;
                document.body.style.cursor = 'grabbing';
                event.preventDefault();
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 2) {
                isMouseDown = false;
                this.mouseControl.enabled = false;
                document.body.style.cursor = 'default';
            }
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.mouseControl.enabled && isMouseDown) {
                this.mouseControl.yaw -= event.movementX * this.mouseControl.sensitivity;
                this.mouseControl.pitch -= event.movementY * this.mouseControl.sensitivity;
                
                // Pitch'i sınırla
                this.mouseControl.pitch = MathUtils.clamp(
                    this.mouseControl.pitch,
                    -this.mouseControl.maxPitch,
                    this.mouseControl.maxPitch
                );
            }
        });
        
        // Kamera modu değiştirme (C tuşu)
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyC') {
                this.switchCameraMode();
                event.preventDefault();
            }
        });
    }
    
    /**
     * Kamera modunu değiştir
     */
    switchCameraMode() {
        const modes = Object.values(this.modes);
        const currentIndex = modes.indexOf(this.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        this.currentMode = modes[nextIndex];
        
        // Mouse kontrolünü sıfırla
        this.mouseControl.pitch = 0;
        this.mouseControl.yaw = 0;
        
        console.log(`📷 Kamera modu: ${this.currentMode}`);
    }
    
    /**
     * Kamerayı güncelle
     */
    update(deltaTime) {
        // Hedef pozisyonları hesapla
        this.updateTargetPositions();
        
        // Shake efektini uygula
        this.updateShake(deltaTime);
        
        // Kamera pozisyonunu smooth olarak güncelle
        this.smoothCameraMovement(deltaTime);
        
        // Mouse kontrolünü uygula
        this.applyMouseControls();
    }
    
    /**
     * Hedef pozisyonları hesapla (moda göre)
     */
    updateTargetPositions() {
        const vehiclePos = this.vehicle.getPosition();
        const vehicleRot = this.vehicle.getRotation();
        
        switch (this.currentMode) {
            case this.modes.THIRD_PERSON:
                this.calculateThirdPersonTargets(vehiclePos, vehicleRot);
                break;
                
            case this.modes.FIRST_PERSON:
                this.calculateFirstPersonTargets(vehiclePos, vehicleRot);
                break;
                
            case this.modes.CINEMATIC:
                this.calculateCinematicTargets(vehiclePos, vehicleRot);
                break;
        }
    }
    
    /**
     * Third person kamera hedeflerini hesapla
     */
    calculateThirdPersonTargets(vehiclePos, vehicleRot) {
        const settings = this.settings.thirdPerson;
        
        // Araç arkasında pozisyon
        const behindOffset = new THREE.Vector3(
            settings.offsetX,
            settings.height,
            -settings.distance
        );
        
        // Araç rotasyonunu uygula
        behindOffset.applyEuler(vehicleRot);
        
        // Hedef pozisyon
        this.targetPosition.copy(vehiclePos).add(behindOffset);
        
        // Bakış hedefi (araç + ileri yön)
        const forwardOffset = new THREE.Vector3(0, 0, settings.lookAhead);
        forwardOffset.applyEuler(vehicleRot);
        this.targetLookAt.copy(vehiclePos).add(forwardOffset);
        
        // Hız bazlı ayarlama
        const speed = this.vehicle.getSpeed();
        const speedFactor = Math.min(speed / 50, 1); // 50 km/h'de maksimum
        
        // Yüksek hızda kamerayı daha uzağa çek
        this.targetPosition.y += speedFactor * 2;
        
        // Hızlı virajlarda kamerayı daha yanlamasına al
        const angularVel = Math.abs(this.vehicle.angularVelocity);
        const lateralOffset = angularVel * 3;
        this.targetPosition.x += Math.sign(this.vehicle.angularVelocity) * lateralOffset;
    }
    
    /**
     * First person kamera hedeflerini hesapla
     */
    calculateFirstPersonTargets(vehiclePos, vehicleRot) {
        const settings = this.settings.firstPerson;
        
        // Araç içi pozisyon
        const insideOffset = new THREE.Vector3(0, settings.height, settings.offsetZ);
        insideOffset.applyEuler(vehicleRot);
        
        this.targetPosition.copy(vehiclePos).add(insideOffset);
        
        // İleri bakış
        const forwardOffset = new THREE.Vector3(0, 0, settings.lookAhead);
        forwardOffset.applyEuler(vehicleRot);
        this.targetLookAt.copy(vehiclePos).add(forwardOffset);
    }
    
    /**
     * Cinematic kamera hedeflerini hesapla
     */
    calculateCinematicTargets(vehiclePos, vehicleRot) {
        const settings = this.settings.cinematic;
        
        this.cinematicTime += 0.016; // ~60fps
        this.cinematicCenter.copy(vehiclePos);
        
        // Dairesel hareket
        const angle = this.cinematicTime * settings.speed;
        const radius = settings.radius + Math.sin(this.cinematicTime * settings.oscillation) * 3;
        
        this.targetPosition.set(
            this.cinematicCenter.x + Math.cos(angle) * radius,
            this.cinematicCenter.y + settings.height + Math.sin(this.cinematicTime * 0.3) * 2,
            this.cinematicCenter.z + Math.sin(angle) * radius
        );
        
        // Araç merkezi + biraz ileri
        const forwardOffset = new THREE.Vector3(0, 1, 2);
        forwardOffset.applyEuler(vehicleRot);
        this.targetLookAt.copy(vehiclePos).add(forwardOffset);
    }
    
    /**
     * Kamera hareketini smooth yap
     */
    smoothCameraMovement(deltaTime) {
        const followSpeed = this.currentMode === this.modes.THIRD_PERSON ? 
            this.settings.thirdPerson.followSpeed : 12;
        const rotationSpeed = this.currentMode === this.modes.THIRD_PERSON ?
            this.settings.thirdPerson.rotationSpeed : 8;
        
        // Pozisyon smoothing
        this.camera.position.lerp(this.targetPosition, deltaTime * followSpeed);
        
        // LookAt smoothing
        this.currentLookAt.lerp(this.targetLookAt, deltaTime * rotationSpeed);
        
        // Kamerayı hedefi takip ettir
        this.camera.lookAt(this.currentLookAt);
    }
    
    /**
     * Mouse kontrollerini uygula
     */
    applyMouseControls() {
        if (this.currentMode === this.modes.THIRD_PERSON && 
            (this.mouseControl.pitch !== 0 || this.mouseControl.yaw !== 0)) {
            
            // Mouse kontrolü ile kamera pozisyonunu ayarla
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(
                this.camera.position.clone().sub(this.targetLookAt)
            );
            
            spherical.theta += this.mouseControl.yaw;
            spherical.phi += this.mouseControl.pitch;
            
            // Phi'yi sınırla (çok yukarı/aşağı bakmasın)
            spherical.phi = MathUtils.clamp(spherical.phi, 0.1, Math.PI - 0.1);
            
            const newPosition = new THREE.Vector3();
            newPosition.setFromSpherical(spherical);
            newPosition.add(this.targetLookAt);
            
            this.camera.position.copy(newPosition);
            this.camera.lookAt(this.targetLookAt);
        }
    }
    
    /**
     * Kamera sarsıntısını güncelle
     */
    updateShake(deltaTime) {
        if (this.shakeDuration > 0) {
            this.shakeTimer += deltaTime;
            
            if (this.shakeTimer < this.shakeDuration) {
                // Shake efekti uygula
                const shakeAmount = this.shakeIntensity * 
                    (1 - this.shakeTimer / this.shakeDuration); // Azalan
                
                const shakeX = (Math.random() - 0.5) * shakeAmount;
                const shakeY = (Math.random() - 0.5) * shakeAmount;
                const shakeZ = (Math.random() - 0.5) * shakeAmount;
                
                this.camera.position.add(new THREE.Vector3(shakeX, shakeY, shakeZ));
            } else {
                // Shake bitti
                this.shakeDuration = 0;
                this.shakeTimer = 0;
                this.shakeIntensity = 0;
            }
        }
    }
    
    /**
     * Kamera sarsıntısı başlat
     */
    shake(intensity = 0.1, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = 0;
    }
    
    /**
     * Belirli bir pozisyona yumuşak geçiş
     */
    smoothTransitionTo(position, lookAt, duration = 2.0) {
        // Gelecekte animasyon sistemi için
        // Şimdilik direkt ayarla
        this.targetPosition.copy(position);
        this.targetLookAt.copy(lookAt);
    }
    
    /**
     * Kamera modunu ayarla
     */
    setCameraMode(mode) {
        if (Object.values(this.modes).includes(mode)) {
            this.currentMode = mode;
            
            // Mouse kontrolünü sıfırla
            this.mouseControl.pitch = 0;
            this.mouseControl.yaw = 0;
            
            console.log(`📷 Kamera modu ayarlandı: ${mode}`);
        }
    }
    
    /**
     * Kamera ayarlarını güncelle
     */
    updateSettings(mode, settings) {
        if (this.settings[mode]) {
            Object.assign(this.settings[mode], settings);
        }
    }
    
    /**
     * Mevcut kamera modunu al
     */
    getCurrentMode() {
        return this.currentMode;
    }
    
    /**
     * Kamera pozisyonunu al
     */
    getPosition() {
        return this.camera.position.clone();
    }
    
    /**
     * Kamera baktığı yönü al
     */
    getLookDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }
}
