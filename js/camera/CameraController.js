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
        
        // MANUEL ROTASYON EKLEYELİM
        this.manualRotation = {
            x: 0,
            y: 0
        };
        
        // Kamera ayarları
        this.settings = {
            // Third person ayarları - TAKİP HIZI ARTTIRILDI
            thirdPerson: {
                distance: 10,          // 12'den 10'a düşürüldü - daha yakın takip
                height: 4,             // Yükseklik
                angle: 0.1,            // Aşağı bakma açısı
                followSpeed: 18,        // 4'den 8'e çıkarıldı - daha hızlı takip
                rotationSpeed: 6,      // 3'den 6'ya çıkarıldı - daha hızlı dönüş
                offsetX: 0,            // Yan kayma
                lookAhead: 2           // İlerisine bakma
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
        this.mouseState = {
            isDown: false,
            lastX: 0,
            lastY: 0,
            sensitivity: 0.002
        };
        
        // Mouse event'leri - SAL TIK SAĞ TIK KARIŞIKLIĞINI ÇÖZELIM
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Sol tık
                this.mouseState.isDown = true;
                this.mouseState.lastX = event.clientX;
                this.mouseState.lastY = event.clientY;
                event.preventDefault();
            }
            // Sağ tık (button === 2) için hiçbir şey yapma
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) { // Sol tık
                this.mouseState.isDown = false;
            }
            // Sağ tık için hiçbir şey yapma
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.mouseState.isDown && event.buttons === 1) { // Sadece sol tık sürüklemesi
                const deltaX = event.clientX - this.mouseState.lastX;
                const deltaY = event.clientY - this.mouseState.lastY;
                
                this.manualRotation.y -= deltaX * this.mouseState.sensitivity;
                this.manualRotation.x -= deltaY * this.mouseState.sensitivity;
                
                this.manualRotation.x = MathUtils.clamp(this.manualRotation.x, -Math.PI/3, Math.PI/6);
                
                this.mouseState.lastX = event.clientX;
                this.mouseState.lastY = event.clientY;
                
                event.preventDefault();
            }
        });
        
        // SADECE CANVAS İÇİN context menu'yu kapat
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
        }
        
        console.log('🖱️ Mouse kontrolleri ayarlandı');
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
     * Third person kamera hedeflerini hesapla - HIZ BAZLI TAKİP EKLENDİ
     */
    calculateThirdPersonTargets(vehiclePos, vehicleRot) {
        const settings = this.settings.thirdPerson;
        
        // Hız bazlı uzaklık ayarlaması - yüksek hızda daha uzaktan takip
        const speed = this.vehicle.getSpeed();
        const baseDistance = settings.distance;
        const speedBasedDistance = baseDistance + Math.min(speed / 20, 4); // Her 20 km/h için +1 birim, maksimum +4
        
        // Araç arkasında pozisyon - hız bazlı mesafe
        const distance = speedBasedDistance;
        const height = settings.height;
        
        // Araç yönünü al
        const vehicleDirection = vehicleRot.y;
        
        // Kamera pozisyonunu araç arkasında hesapla
        this.targetPosition.set(
            vehiclePos.x - Math.sin(vehicleDirection) * distance,
            vehiclePos.y + height,
            vehiclePos.z - Math.cos(vehicleDirection) * distance
        );
        
        // Bakış hedefi - araç + hız bazlı ileri bakış
        const speedBasedLookAhead = settings.lookAhead + Math.min(speed / 25, 3); // Hızda daha ileri bak
        this.targetLookAt.set(
            vehiclePos.x + Math.sin(vehicleDirection) * speedBasedLookAhead,
            vehiclePos.y + 0.5, // Araç seviyesinde bak
            vehiclePos.z + Math.cos(vehicleDirection) * speedBasedLookAhead
        );
        
        // Yüksek hızda kamerayı biraz yukarı çek
        if (speed > 40) {
            const speedFactor = Math.min((speed - 40) / 60, 0.8); // Maksimum 0.8 etki
            this.targetPosition.y += speedFactor * 2.0; // Yükseklik artışı
        }
        
        // Angular velocity etkisini minimal tut
        const angularVel = this.vehicle.angularVelocity || 0;
        if (Math.abs(angularVel) > 0.8) { // Sadece çok güçlü virajlarda
            const lateralOffset = Math.sign(angularVel) * Math.min(Math.abs(angularVel) * 0.2, 0.5);
            this.targetPosition.x += lateralOffset;
        }
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
    /**
     * Kamera hareketini yumuşatma - HIZLI TAKİP İÇİN DÜZELTİLDİ
     */
    smoothCameraMovement(deltaTime) {
        // Follow speed'leri yeterince hızlı yap
        const baseFollowSpeed = this.currentMode === this.modes.THIRD_PERSON ? 
            this.settings.thirdPerson.followSpeed * 0.8 : 8; // 0.4'den 0.8'e çıkarıldı
        const baseRotationSpeed = this.currentMode === this.modes.THIRD_PERSON ?
            this.settings.thirdPerson.rotationSpeed * 0.8 : 6; // 0.5'den 0.8'e çıkarıldı
        
        // Hız bazlı ayarlama - düşük hızda daha yavaş, yüksek hızda daha hızlı
        const vehicleSpeed = this.vehicle.getSpeed();
        let speedMultiplier = 1.0; // Varsayılan çarpan
        
        if (vehicleSpeed > 50) {
            // Yüksek hızda daha agresif takip
            speedMultiplier = 1.0 + (vehicleSpeed - 50) / 100; // Maksimum 1.5x hız
        } else if (vehicleSpeed < 20) {
            // Düşük hızda daha yumuşak
            speedMultiplier = 0.7;
        }
        
        const followSpeed = baseFollowSpeed * speedMultiplier;
        const rotationSpeed = baseRotationSpeed * speedMultiplier;
        
        // Pozisyon smoothing - daha hızlı lerp
        const maxPositionLerp = Math.min(deltaTime * followSpeed, 0.20); // 0.08'den 0.20'ye çıkarıldı
        this.camera.position.lerp(this.targetPosition, maxPositionLerp);
        
        // LookAt smoothing - daha hızlı
        const maxRotationLerp = Math.min(deltaTime * rotationSpeed, 0.15); // 0.06'dan 0.15'e çıkarıldı
        this.currentLookAt.lerp(this.targetLookAt, maxRotationLerp);
        
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
