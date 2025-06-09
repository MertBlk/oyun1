import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Oyun çevresi ve atmosfer yönetimi
 */
export class Environment {
    constructor(scene) {
        this.scene = scene;
        
        // Çevre grupları
        this.environmentGroup = new THREE.Group();
        this.scene.add(this.environmentGroup);
        
        // Gökyüzü ve atmosfer
        this.skybox = null;
        this.clouds = [];
        
        // Uzak nesneler (dağlar, binalar)
        this.backgroundObjects = [];
        this.mountains = null;
        
        // Partiküller ve efektler
        this.particles = null;
        this.particleSystem = null;
        
        // Çevre ayarları
        this.settings = {
            timeOfDay: 0.5, // 0: gece, 1: gündüz
            weatherType: 'clear', // clear, cloudy, rain
            windSpeed: 1.0,
            visibility: 300 // sis için
        };
        
        // Dinamik nesneler
        this.cloudUpdateTimer = 0;
        this.lastPlayerPosition = new THREE.Vector3();
        
        this.init();
        console.log('🌍 Çevre sistemi başlatıldı');
    }
    
    /**
     * Çevre sistemini başlat
     */
    init() {
        this.createSkybox();
        this.createMountains();
        this.createClouds();
        this.createParticles();
        this.updateLighting();
    }
    
    /**
     * Gökyüzü oluştur
     */
    createSkybox() {
        // Basit gradyan gökyüzü
        const skyGeometry = new THREE.SphereGeometry(500, 32, 16);
        
        // Vertex shader ile gradyan efekti
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.environmentGroup.add(this.skybox);
    }
    
    /**
     * Uzak dağlar oluştur
     */
    createMountains() {
        const mountainsGroup = new THREE.Group();
        
        const mountainCount = 8;
        const radius = 400; // Oyuncudan uzaklık
        
        for (let i = 0; i < mountainCount; i++) {
            const angle = (i / mountainCount) * Math.PI * 2;
            
            // Rastgele dağ boyutu
            const width = MathUtils.random(30, 80);
            const height = MathUtils.random(40, 120);
            const depth = MathUtils.random(20, 50);
            
            const mountainGeometry = new THREE.ConeGeometry(width, height, 6);
            const mountainMaterial = new THREE.MeshLambertMaterial({
                color: new THREE.Color().setHSL(0.1, 0.3, MathUtils.random(0.3, 0.6))
            });
            
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            
            // Pozisyonlandır
            mountain.position.x = Math.cos(angle) * radius;
            mountain.position.z = Math.sin(angle) * radius;
            mountain.position.y = height / 2 - 10; // Biraz toprağa göm
            
            // Rastgele rotasyon
            mountain.rotation.y = MathUtils.random(0, Math.PI * 2);
            
            mountain.receiveShadow = true;
            
            mountainsGroup.add(mountain);
        }
        
        this.mountains = mountainsGroup;
        this.environmentGroup.add(mountainsGroup);
    }
    
    /**
     * Bulutlar oluştur
     */
    createClouds() {
        const cloudCount = 12;
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = this.createSingleCloud();
            
            // Rastgele pozisyon
            cloud.position.x = MathUtils.random(-200, 200);
            cloud.position.y = MathUtils.random(20, 60);
            cloud.position.z = MathUtils.random(-200, 200);
            
            // Rastgele ölçek
            const scale = MathUtils.random(0.5, 2.0);
            cloud.scale.set(scale, scale, scale);
            
            this.clouds.push(cloud);
            this.environmentGroup.add(cloud);
        }
    }
    
    /**
     * Tek bir bulut oluştur
     */
    createSingleCloud() {
        const cloudGroup = new THREE.Group();
        
        const cloudMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        // Bulut birden fazla küre ile oluştur
        const sphereCount = MathUtils.randomInt(3, 7);
        
        for (let i = 0; i < sphereCount; i++) {
            const sphereGeometry = new THREE.SphereGeometry(
                MathUtils.random(2, 6),
                8, 6
            );
            const sphere = new THREE.Mesh(sphereGeometry, cloudMaterial);
            
            // Rastgele pozisyon
            sphere.position.x = MathUtils.random(-8, 8);
            sphere.position.y = MathUtils.random(-2, 2);
            sphere.position.z = MathUtils.random(-8, 8);
            
            cloudGroup.add(sphere);
        }
        
        return cloudGroup;
    }
    
    /**
     * Partiküller oluştur (yağmur, kar vs. için hazırlık)
     */
    createParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            // Başlangıç pozisyonları
            positions[i] = MathUtils.random(-50, 50);     // x
            positions[i + 1] = MathUtils.random(10, 50);  // y
            positions[i + 2] = MathUtils.random(-50, 50); // z
            
            // Hızlar (şimdilik kullanılmıyor)
            velocities[i] = 0;
            velocities[i + 1] = 0;
            velocities[i + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.visible = false; // Başlangıçta gizli
        this.environmentGroup.add(this.particles);
    }
    
    /**
     * Aydınlatmayı güncelle (gün/gece döngüsü)
     */
    updateLighting() {
        // Güneş pozisyonu (timeOfDay'e göre)
        const sunAngle = this.settings.timeOfDay * Math.PI * 2;
        
        // Ana directional light'ı güncelle (GameEngine'den gelen)
        const directionalLight = this.scene.children.find(child => 
            child instanceof THREE.DirectionalLight
        );
        
        if (directionalLight) {
            directionalLight.position.x = Math.cos(sunAngle) * 20;
            directionalLight.position.y = Math.sin(sunAngle) * 20 + 10;
            directionalLight.position.z = 5;
            
            // Işık yoğunluğu (gece/gündüz)
            const intensity = Math.max(0.2, Math.sin(sunAngle * 0.5));
            directionalLight.intensity = intensity;
        }
        
        // Ambient light'ı güncelle
        const ambientLight = this.scene.children.find(child => 
            child instanceof THREE.AmbientLight
        );
        
        if (ambientLight) {
            const ambientIntensity = Math.max(0.1, Math.sin(sunAngle * 0.5) * 0.3);
            ambientLight.intensity = ambientIntensity;
        }
        
        // Skybox renklerini güncelle
        if (this.skybox) {
            const topColor = new THREE.Color().setHSL(
                0.6, // Hue (mavi)
                0.7, // Saturation
                0.3 + this.settings.timeOfDay * 0.4 // Lightness
            );
            
            const bottomColor = new THREE.Color().setHSL(
                0.1, // Hue (sarı-turuncu)
                0.5,
                0.7 + this.settings.timeOfDay * 0.2
            );
            
            this.skybox.material.uniforms.topColor.value = topColor;
            this.skybox.material.uniforms.bottomColor.value = bottomColor;
        }
    }
    
    /**
     * Çevreyi güncelle
     */
    update(playerPosition) {
        // Bulutları hareket ettir
        this.updateClouds(playerPosition);
        
        // Dağları oyuncuyla birlikte hareket ettir (parallax efekti)
        this.updateMountains(playerPosition);
        
        // Partikülleri güncelle
        this.updateParticles();
        
        // Gün/gece döngüsü (yavaş)
        this.updateTimeOfDay();
        
        this.lastPlayerPosition.copy(playerPosition);
    }
    
    /**
     * Bulutları güncelle
     */
    updateClouds(playerPosition) {
        this.cloudUpdateTimer += 0.016; // ~60fps
        
        this.clouds.forEach((cloud, index) => {
            // Yavaş hareket
            cloud.position.x += Math.sin(this.cloudUpdateTimer + index) * 0.01;
            cloud.position.z += this.settings.windSpeed * 0.005;
            
            // Oyuncudan çok uzaklaştıysa pozisyonu sıfırla
            const distance = cloud.position.distanceTo(playerPosition);
            if (distance > 300) {
                cloud.position.x = playerPosition.x + MathUtils.random(-200, 200);
                cloud.position.z = playerPosition.z + MathUtils.random(100, 200);
            }
        });
    }
    
    /**
     * Dağları güncelle (parallax efekti)
     */
    updateMountains(playerPosition) {
        if (this.mountains) {
            // Dağlar oyuncunun yarısı kadar hareket etsin (parallax)
            const deltaX = (playerPosition.x - this.lastPlayerPosition.x) * 0.1;
            const deltaZ = (playerPosition.z - this.lastPlayerPosition.z) * 0.1;
            
            this.mountains.position.x += deltaX;
            this.mountains.position.z += deltaZ;
        }
    }
    
    /**
     * Partikülleri güncelle
     */
    updateParticles() {
        if (this.settings.weatherType === 'rain' && this.particles) {
            this.particles.visible = true;
            
            const positions = this.particles.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Yağmur damlalarını aşağı hareket ettir
                positions[i + 1] -= 0.5; // Y pozisyonu
                
                // Zemine değdiyse yukarı teleport et
                if (positions[i + 1] < 0) {
                    positions[i + 1] = 50;
                    positions[i] = MathUtils.random(-50, 50);
                    positions[i + 2] = MathUtils.random(-50, 50);
                }
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
        } else {
            if (this.particles) {
                this.particles.visible = false;
            }
        }
    }
    
    /**
     * Gün/gece döngüsünü güncelle
     */
    updateTimeOfDay() {
        // Çok yavaş döngü (oyun süresi boyunca birkaç defa)
        this.settings.timeOfDay += 0.0001;
        if (this.settings.timeOfDay > 1) {
            this.settings.timeOfDay = 0;
        }
        
        // Aydınlatmayı güncelle
        this.updateLighting();
    }
    
    /**
     * Hava durumunu değiştir
     */
    setWeather(weatherType) {
        this.settings.weatherType = weatherType;
        
        switch (weatherType) {
            case 'rain':
                this.settings.visibility = 150;
                if (this.scene.fog) {
                    this.scene.fog.far = this.settings.visibility;
                }
                break;
            case 'clear':
                this.settings.visibility = 300;
                if (this.scene.fog) {
                    this.scene.fog.far = this.settings.visibility;
                }
                break;
            case 'cloudy':
                this.settings.visibility = 200;
                if (this.scene.fog) {
                    this.scene.fog.far = this.settings.visibility;
                }
                break;
        }
        
        console.log(`🌤️ Hava durumu değişti: ${weatherType}`);
    }
    
    /**
     * Gün zamanını ayarla
     */
    setTimeOfDay(time) {
        this.settings.timeOfDay = MathUtils.clamp(time, 0, 1);
        this.updateLighting();
    }
    
    /**
     * Rüzgar hızını ayarla
     */
    setWindSpeed(speed) {
        this.settings.windSpeed = speed;
    }
    
    /**
     * Kaynakları temizle
     */
    dispose() {
        // Bulutları temizle
        this.clouds.forEach(cloud => {
            this.environmentGroup.remove(cloud);
            cloud.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        
        // Diğer nesneleri temizle
        this.environmentGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        this.scene.remove(this.environmentGroup);
        
        console.log('🗑️ Çevre kaynakları temizlendi');
    }
}
