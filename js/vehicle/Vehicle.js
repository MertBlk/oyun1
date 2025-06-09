import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * 3D Araç sınıfı - temel geometrik şekillerle başlangıç
 */
export class Vehicle {
    constructor(scene) {
        this.scene = scene;
        
        // Araç grubu - tüm araç parçalarını içerir
        this.group = new THREE.Group();
        
        // Fizik özellikleri
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.angularVelocity = 0;
        
        // Araç özellikleri
        this.mass = 1000; // kg
        this.maxSpeed = 30; // m/s (~108 km/h)
        this.acceleration_force = 8000; // N
        this.brake_force = 12000; // N
        this.steering_angle = 0;
        this.max_steering_angle = Math.PI / 4; // 45 derece
        
        // Direnç kuvvetleri
        this.air_resistance = 0.98;
        this.rolling_resistance = 0.95;
        
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
        this.speed = 0; // Hız (km/h)
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
        // Başlangıç değerleri
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.angularVelocity = 0;
    }
    
    /**
     * Aracı güncelle
     */
    update(deltaTime, inputController) {
        // Input'ları al
        const forwardInput = inputController.getForwardInput();
        const sideInput = inputController.getSideInput();
        const brakeInput = inputController.getBrakeInput();
        
        // Fizik hesaplamaları
        this.updatePhysics(deltaTime, forwardInput, sideInput, brakeInput);
        
        // Pozisyon ve rotasyonu güncelle
        this.updateTransform();
        
        // Tekerlek animasyonları
        this.updateWheelAnimations(deltaTime);
        
        // Hız hesapla (km/h)
        this.speed = this.velocity.length() * 3.6;
    }
    
    /**
     * Fizik hesaplamalarını yap
     */
    updatePhysics(deltaTime, forwardInput, sideInput, brakeInput) {
        // Direksiyon açısını güncelle
        this.steering_angle = MathUtils.lerp(
            this.steering_angle,
            sideInput * this.max_steering_angle,
            deltaTime * 8
        );
        
        // Kuvvetleri hesapla
        const forces = new THREE.Vector3(0, 0, 0);
        
        // İleri/geri kuvvet
        if (Math.abs(forwardInput) > 0.1) {
            const engineForce = forwardInput * this.acceleration_force;
            forces.z += engineForce;
        }
        
        // Fren kuvveti
        if (brakeInput > 0.1) {
            const brakeDirection = this.velocity.clone().normalize().multiplyScalar(-1);
            forces.add(brakeDirection.multiplyScalar(this.brake_force * brakeInput));
        }
        
        // Hava direnci
        const airResistanceForce = this.velocity.clone()
            .multiplyScalar(-this.velocity.lengthSq() * 0.5);
        forces.add(airResistanceForce);
        
        // Yuvarlanma direnci
        const rollingResistanceForce = this.velocity.clone()
            .multiplyScalar(-50);
        forces.add(rollingResistanceForce);
        
        // Newton'un ikinci yasası: F = ma -> a = F/m
        this.acceleration.copy(forces).divideScalar(this.mass);
        
        // Hızı güncelle
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // Maksimum hızı sınırla
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        // Açısal hız (direksiyon)
        if (this.velocity.length() > 0.1 && Math.abs(this.steering_angle) > 0.01) {
            this.angularVelocity = (this.steering_angle * this.velocity.length()) / this.dimensions.length;
        } else {
            this.angularVelocity *= 0.95; // Yavaşça durdur
        }
        
        // Pozisyonu güncelle
        const velocityDelta = this.velocity.clone().multiplyScalar(deltaTime);
        
        // Aracın yönünü dikkate al
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyEuler(this.rotation);
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(this.rotation);
        
        // Hareket vektörünü hesapla
        const movement = new THREE.Vector3();
        movement.add(forward.multiplyScalar(velocityDelta.z));
        movement.add(right.multiplyScalar(velocityDelta.x));
        
        this.position.add(movement);
        
        // Rotasyonu güncelle
        this.rotation.y += this.angularVelocity * deltaTime;
        
        // Direnç kuvvetlerini uygula
        this.velocity.multiplyScalar(this.air_resistance);
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
     * Aracın mevcut hızını al (km/h)
     */
    getSpeed() {
        return this.speed;
    }
    
    /**
     * Aracın mevcut pozisyonunu al
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Aracın mevcut rotasyonunu al
     */
    getRotation() {
        return this.rotation.clone();
    }
    
    /**
     * Aracın ön yönünü al (vector)
     */
    getForwardDirection() {
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyEuler(this.rotation);
        return forward;
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
