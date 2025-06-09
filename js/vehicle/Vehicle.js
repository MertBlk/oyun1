import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * 3D Araç sınıfı - temel geometrik şekillerle başlangıç
 */
export class Vehicle {
    constructor(scene) {
        this.scene = scene;
        
        // THREE.js Group - EKLE
        this.group = new THREE.Group();
        
        // Temel özellikler
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0); // THREE.Euler objesi olarak değiştir
        this.rotationY = 0; // Y ekseni rotasyonu için ayrı sayı
        this.currentSpeed = 0; // m/s cinsinden
        this.speed = 0; // km/h cinsinden (UI için)
        
        // Fizik property'leri - EKLE
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = 0;
        this.steering_angle = 0;
        this.max_steering_angle = Math.PI / 6; // 30 derece
        this.acceleration_force = 5000;
        this.brake_force = 3000;
        this.mass = 1000;
        // Fizik özellikleri - BASİTLEŞTİRİLMİŞ
        this.maxSpeed = 100; // km/h
        this.friction = 0.95; // Sürtünme katsayısı

        // Araç boyutları
        this.dimensions = {
            width: 1.8,
            height: 1.2,
            length: 4.0
        };
        
        // Araç parçaları
        this.body = null;
        this.wheels = [];
        
        // Animasyon ve efektler
        this.isGrounded = true;
        this.engineSound = null; // Gelecekte ses sistemi için
        
        this.createVehicle();
        this.setupPhysics();
        
        console.log('🚗 Araç oluşturuldu');
    }
    
    /**
     * Aracı oluştur (temel geometrik şekiller)
     */
    createVehicle() {
        this.createBody();
        this.createWheels();
        
        // Aracı sahneye ekle
        this.scene.add(this.group);
        
        // Başlangıç pozisyonu
        this.group.position.copy(this.position);
    }
    
    /**
     * Araç gövdesi oluştur
     */
    createBody() {
        // Ana gövde (dikdörtgen)
        const bodyGeometry = new THREE.BoxGeometry(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.length
        );
        
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: 0xff4444
        });
        
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = this.dimensions.height / 2 + 0.3; // Tekerleklerin üstünde
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        
        // Cam (üst kısım)
        const windowGeometry = new THREE.BoxGeometry(
            this.dimensions.width * 0.8,
            this.dimensions.height * 0.4,
            this.dimensions.length * 0.6
        );
        
        const windowMaterial = new THREE.MeshLambertMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.6
        });
        
        const windows = new THREE.Mesh(windowGeometry, windowMaterial);
        windows.position.y = this.dimensions.height * 0.7;
        this.body.add(windows);
        
        this.group.add(this.body);
    }
    
    /**
     * Tekerlekleri oluştur
     */
    createWheels() {
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        // Tekerlek pozisyonları (ön sol, ön sağ, arka sol, arka sağ)
        const wheelPositions = [
            { x: -this.dimensions.width/2 - 0.1, y: 0.3, z: this.dimensions.length/2 - 0.5 },  // Ön sol
            { x: this.dimensions.width/2 + 0.1, y: 0.3, z: this.dimensions.length/2 - 0.5 },   // Ön sağ
            { x: -this.dimensions.width/2 - 0.1, y: 0.3, z: -this.dimensions.length/2 + 0.5 }, // Arka sol
            { x: this.dimensions.width/2 + 0.1, y: 0.3, z: -this.dimensions.length/2 + 0.5 }   // Arka sağ
        ];
        
        wheelPositions.forEach((pos, index) => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.z = Math.PI / 2; // Tekerlekleri yatay çevir
            wheel.castShadow = true;
            
            // Tekerlek animasyonu için referans
            wheel.userData = {
                isStearing: index < 2, // İlk iki tekerlek (ön tekerlekler) direksiyon
                rotationSpeed: 0
            };
            
            this.wheels.push(wheel);
            this.group.add(wheel);
        });
    }
    
    /**
     * Fizik sistemini ayarla
     */
    setupPhysics() {
        // Başlangıç değerleri - önceden tanımlanmış vectorları kullan
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.angularVelocity = 0;
    }
    
    /**
     * Aracı güncelle
     */
    update(deltaTime, inputState) {
        // Input'ları al
        const throttle = inputState.forward ? 1 : (inputState.backward ? -0.6 : 0);
        const brake = inputState.handbrake ? 1 : 0;
        
        // STEERING - DÜZELTİLDİ - YÖN SORUNU ÇÖZÜLDÜ
        let steering = 0;
        if (inputState.left) steering = 1;    // A tuşu = SOLA (pozitif rotasyon)
        if (inputState.right) steering = -1;  // D tuşu = SAĞA (negatif rotasyon)
        
        // DEBUG - daha az spam
        if (throttle !== 0 && Date.now() - (this.lastDebugLog || 0) > 1000) { // 1 saniyede bir
            console.log('🚗 Throttle aktif:', throttle, 'Input:', inputState);
            this.lastDebugLog = Date.now();
        }
        
        // BASİT FİZİK - kompleks fizik yerine
        if (Math.abs(throttle) > 0.1) {
            // İleri/geri hareket
            const acceleration = throttle * 50; // Sabit ivme
            this.currentSpeed += acceleration * deltaTime;
            
            // Maksimum hızı sınırla
            this.currentSpeed = MathUtils.clamp(this.currentSpeed, -30, 100);
        } else {
            // Doğal yavaşlama
            this.currentSpeed *= 0.95;
        }
        
        // Direksiyon - Angular velocity de eklensin, DÜZELTİLDİ
        if (Math.abs(steering) > 0.1 && Math.abs(this.currentSpeed) > 1) {
            const rotationChange = steering * 0.015 * (this.currentSpeed / 50); // 0.02'den 0.015'e düşürüldü
            this.rotationY += rotationChange;
            
            // Angular velocity'yi daha yumuşak hesapla (kamera için)
            this.angularVelocity = MathUtils.lerp(this.angularVelocity, rotationChange / deltaTime, 0.3);
        } else {
            // Angular velocity'yi yumuşak sıfırla
            this.angularVelocity *= 0.85; // 0.9'dan 0.85'e düşürüldü - daha hızlı sıfırlama
        }
        
        // Pozisyonu güncelle
        const moveDistance = this.currentSpeed * deltaTime;
        this.position.x += Math.sin(this.rotationY) * moveDistance;
        this.position.z += Math.cos(this.rotationY) * moveDistance;
        
        // THREE.Euler objesini güncelle
        this.rotation.set(0, this.rotationY, 0);
        
        // Mesh'i güncelle
        this.group.position.copy(this.position);
        this.group.rotation.copy(this.rotation);
        
        // Hız hesapla (km/h)
        this.speed = Math.abs(this.currentSpeed) * 3.6;
        
        // Debug - daha az spam
        if (Date.now() - (this.lastSpeedLog || 0) > 2000) { // 2 saniyede bir
            console.log('🚗 Speed:', this.speed.toFixed(1), 'Position:', this.position.x.toFixed(1), this.position.z.toFixed(1));
            this.lastSpeedLog = Date.now();
        }
    }
    
    /**
     * Araç pozisyonunu al
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Araç rotasyonunu al
     */
    getRotation() {
        return this.rotation.clone();
    }
    
    /**
     * Araç hızını al (km/h)
     */
    getSpeed() {
        return this.speed || 0;
    }
    
    /**
     * Araç mesh'ini al
     */
    getMesh() {
        return this.group;
    }
    
    /**
     * Aracın yönünü al (radyan)
     */
    getDirection() {
        return this.rotationY;
    }
    
    /**
     * Aracın hızını m/s cinsinden al
     */
    getVelocity() {
        return this.currentSpeed;
    }
    
    /**
     * Araç bilgilerini al (debug için)
     */
    getInfo() {
        return {
            position: this.position.clone(),
            rotation: this.rotationY,
            speed: this.speed,
            velocity: this.currentSpeed
        };
    }
    
    /**
     * Fizik hesaplamalarını yap
     */
    updatePhysics(deltaTime, throttle, steering, brake) {
        // Direksiyon açısını güncelle
        this.steering_angle = MathUtils.lerp(
            this.steering_angle,
            steering * this.max_steering_angle,
            deltaTime * 8
        );
        
        // Kuvvetleri hesapla - BU KISMI DÜZELTELİM
        const forces = new THREE.Vector3(0, 0, 0);
        
        // İleri/geri kuvvet - DOĞRUDAN UYGULA
        if (Math.abs(throttle) > 0.1) {
            // Aracın yönünü dikkate alarak kuvvet uygula
            const forward = new THREE.Vector3(0, 0, 1);
            forward.applyEuler(this.rotation);
            
            const engineForce = throttle * this.acceleration_force;
            forces.add(forward.multiplyScalar(engineForce));
        }
        
        // Fren kuvveti
        if (brake > 0.1) {
            const brakeDirection = this.velocity.clone().normalize().multiplyScalar(-1);
            forces.add(brakeDirection.multiplyScalar(this.brake_force * brake));
        }
        
        // Hava direnci - azalt
        const airResistanceForce = this.velocity.clone()
            .multiplyScalar(-this.velocity.lengthSq() * 0.1); // 0.5'den 0.1'e düşür
        forces.add(airResistanceForce);
        
        // Yuvarlanma direnci - azalt
        const rollingResistanceForce = this.velocity.clone()
            .multiplyScalar(-10); // 50'den 10'a düşür
        forces.add(rollingResistanceForce);
        
        // Newton'un ikinci yasası: F = ma -> a = F/m
        this.acceleration.copy(forces).divideScalar(this.mass);
        
        // Hızı güncelle
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // Maksimum hızı sınırla
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        // Açısal hız (direksiyon) - BASITLEŞTIR
        if (this.velocity.length() > 0.1 && Math.abs(this.steering_angle) > 0.01) {
            this.angularVelocity = (this.steering_angle * this.velocity.length()) / this.dimensions.length;
        } else {
            this.angularVelocity *= 0.95;
        }
        
        // Pozisyonu güncelle - BASITLEŞTIR
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Rotasyonu güncelle
        this.rotation.y += this.angularVelocity * deltaTime;
        
        // Direnç kuvvetlerini uygula - AZALT
        this.velocity.multiplyScalar(0.99); // 0.98'den 0.99'a çıkar
    }
    
    /**
     * 3D nesne transformunu güncelle
     */
    updateTransform() {
        this.group.position.copy(this.position);
        this.group.rotation.copy(this.rotation);
    }
    
    /**
     * Tekerlek animasyonlarını güncelle
     */
    updateWheelAnimations(deltaTime) {
        const wheelRotationSpeed = this.velocity.length() * 3; // Tekerlek dönüş hızı
        
        this.wheels.forEach((wheel, index) => {
            // Tekerlek dönüşü (ileri/geri hareket)
            wheel.rotation.x += wheelRotationSpeed * deltaTime;
            
            // Ön tekerlekler için direksiyon
            if (wheel.userData.isStearing) {
                wheel.rotation.y = this.steering_angle;
            }
        });
    }
    
    /**
     * Aracı sıfırla (başlangıç pozisyonuna dön)
     */
    reset() {
        this.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
        this.angularVelocity = 0;
        this.steering_angle = 0;
        this.speed = 0;
        
        this.updateTransform();
        
        console.log('🔄 Araç sıfırlandı');
    }
    
    /**
     * Kaynakları temizle
     */
    dispose() {
        // Geometry ve material'ları temizle
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        // Sahneye nesneyi kaldır
        this.scene.remove(this.group);
        
        console.log('🗑️ Araç kaynakları temizlendi');
    }
}
