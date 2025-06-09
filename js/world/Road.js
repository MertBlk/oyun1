import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Dinamik yol oluşturma ve yönetim sistemi
 */
export class Road {
    constructor(scene) {
        this.scene = scene;
        
        // Yol grupları
        this.roadGroup = new THREE.Group();
        this.scene.add(this.roadGroup);
        
        // Yol özellikleri
        this.roadWidth = 8; // metre
        this.segmentLength = 20; // her segment 20m
        this.segmentsAhead = 15; // önde kaç segment oluştur
        this.segmentsBehind = 5; // arkada kaç segment tut
        
        // Yol segmentleri
        this.segments = [];
        this.lastPlayerZ = 0; // Oyuncunun son Z pozisyonu
        
        // Yol türleri ve varyasyonları
        this.roadTypes = ['straight', 'curve_left', 'curve_right', 'slight_curve'];
        this.currentDirection = 0; // Mevcut yol yönü (radyan)
        
        // Materyal ve geometriler
        this.roadMaterial = null;
        this.roadGeometry = null;
        this.lineMaterial = null;
        
        // Yan nesneler (ağaçlar, tabelalar vs.)
        this.roadside_objects = [];
        
        this.init();
        console.log('🛣️ Yol sistemi başlatıldı');
    }
    
    /**
     * Yol sistemini başlat
     */
    init() {
        this.createMaterials();
        this.generateInitialRoad();
    }
    
    /**
     * Materyal ve tekstürleri oluştur
     */
    createMaterials() {
        // Ana yol materyali
        this.roadMaterial = new THREE.MeshLambertMaterial({
            color: 0x444444
        });
        
        // Yol çizgisi materyali
        this.lineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });
        
        // Çim materyali
        this.grassMaterial = new THREE.MeshLambertMaterial({
            color: 0x228B22
        });
        
        // Yol kenarı materyali
        this.sidelineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00
        });
    }
    
    /**
     * İlk yol segmentlerini oluştur
     */
    generateInitialRoad() {
        for (let i = 0; i < this.segmentsAhead; i++) {
            this.addRoadSegment(i * this.segmentLength);
        }
    }
    
    /**
     * Yeni yol segmenti ekle
     */
    addRoadSegment(zPosition) {
        const segment = this.createRoadSegment(zPosition);
        this.segments.push(segment);
        this.roadGroup.add(segment);
    }
    
    /**
     * Tek bir yol segmenti oluştur
     */
    createRoadSegment(zPosition) {
        const segmentGroup = new THREE.Group();
        segmentGroup.position.z = zPosition;
        
        // Yol türünü belirle (rastgele ama akıllı)
        const roadType = this.selectRoadType();
        
        // Ana yol yüzeyi
        const roadSurface = this.createRoadSurface(roadType);
        segmentGroup.add(roadSurface);
        
        // Yol çizgileri
        const roadLines = this.createRoadLines(roadType);
        segmentGroup.add(roadLines);
        
        // Yol kenarları
        const roadSides = this.createRoadSides(roadType);
        segmentGroup.add(roadSides);
        
        // Çim alanları
        const grassAreas = this.createGrassAreas(roadType);
        segmentGroup.add(grassAreas);
        
        // Yan nesneler (rastgele)
        if (Math.random() > 0.7) { // %30 şans
            const sideObjects = this.createRoadsideObjects(roadType);
            segmentGroup.add(sideObjects);
        }
        
        // Segment bilgilerini kaydet
        segmentGroup.userData = {
            type: roadType,
            zPosition: zPosition
        };
        
        return segmentGroup;
    }
    
    /**
     * Yol tipini seç (akıllı seçim)
     */
    selectRoadType() {
        // Basit rastgele seçim - gelecekte daha karmaşık olabilir
        const rand = Math.random();
        
        if (rand < 0.6) {
            return 'straight';
        } else if (rand < 0.8) {
            return 'slight_curve';
        } else if (rand < 0.9) {
            return 'curve_left';
        } else {
            return 'curve_right';
        }
    }
    
    /**
     * Ana yol yüzeyini oluştur
     */
    createRoadSurface(roadType) {
        const geometry = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength, 1, 4);
        
        // Curve efekti için vertex'leri manipüle et
        if (roadType.includes('curve')) {
            this.applyCurveToGeometry(geometry, roadType);
        }
        
        const road = new THREE.Mesh(geometry, this.roadMaterial);
        road.rotation.x = -Math.PI / 2; // Yatay hale getir
        road.receiveShadow = true;
        
        return road;
    }
    
    /**
     * Geometriye curve efekti uygula
     */
    applyCurveToGeometry(geometry, roadType) {
        const vertices = geometry.attributes.position.array;
        const curveIntensity = roadType === 'slight_curve' ? 0.5 : 2.0;
        const direction = roadType.includes('left') ? -1 : 1;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const z = vertices[i + 2]; // Z koordinatı
            const normalizedZ = (z + this.segmentLength / 2) / this.segmentLength; // 0-1 arası
            
            // Sinüs eğrisi uygula
            vertices[i] += Math.sin(normalizedZ * Math.PI) * curveIntensity * direction;
        }
        
        geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Yol çizgilerini oluştur
     */
    createRoadLines(roadType) {
        const linesGroup = new THREE.Group();
        
        // Orta çizgi
        const centerLineGeometry = new THREE.PlaneGeometry(0.2, this.segmentLength, 1, 8);
        const centerLine = new THREE.Mesh(centerLineGeometry, this.lineMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.01; // Yolun biraz üstünde
        
        // Kesikli çizgi efekti için segment'leri ayır
        this.createDashedLine(centerLineGeometry);
        
        linesGroup.add(centerLine);
        
        return linesGroup;
    }
    
    /**
     * Kesikli çizgi oluştur
     */
    createDashedLine(geometry) {
        const vertices = geometry.attributes.position.array;
        
        // Her 4 metre'de bir boşluk bırak
        for (let i = 0; i < vertices.length; i += 3) {
            const z = vertices[i + 2];
            const segment = Math.floor((z + this.segmentLength / 2) / 2) % 4;
            
            if (segment > 1) {
                // Bu vertex'i gizle (alpha ile)
                vertices[i + 1] = -10; // Y'yi aşağı taşı
            }
        }
        
        geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Yol kenarlarını oluştur
     */
    createRoadSides(roadType) {
        const sidesGroup = new THREE.Group();
        
        // Sol kenar
        const leftSideGeometry = new THREE.PlaneGeometry(0.3, this.segmentLength);
        const leftSide = new THREE.Mesh(leftSideGeometry, this.sidelineMaterial);
        leftSide.rotation.x = -Math.PI / 2;
        leftSide.position.x = -this.roadWidth / 2 - 0.15;
        leftSide.position.y = 0.02;
        
        // Sağ kenar
        const rightSideGeometry = new THREE.PlaneGeometry(0.3, this.segmentLength);
        const rightSide = new THREE.Mesh(rightSideGeometry, this.sidelineMaterial);
        rightSide.rotation.x = -Math.PI / 2;
        rightSide.position.x = this.roadWidth / 2 + 0.15;
        rightSide.position.y = 0.02;
        
        sidesGroup.add(leftSide);
        sidesGroup.add(rightSide);
        
        return sidesGroup;
    }
    
    /**
     * Çim alanlarını oluştur
     */
    createGrassAreas(roadType) {
        const grassGroup = new THREE.Group();
        
        const grassWidth = 20; // Çim alanı genişliği
        
        // Sol çim alanı
        const leftGrassGeometry = new THREE.PlaneGeometry(grassWidth, this.segmentLength);
        const leftGrass = new THREE.Mesh(leftGrassGeometry, this.grassMaterial);
        leftGrass.rotation.x = -Math.PI / 2;
        leftGrass.position.x = -this.roadWidth / 2 - grassWidth / 2 - 0.5;
        leftGrass.position.y = -0.01;
        leftGrass.receiveShadow = true;
        
        // Sağ çim alanı
        const rightGrassGeometry = new THREE.PlaneGeometry(grassWidth, this.segmentLength);
        const rightGrass = new THREE.Mesh(rightGrassGeometry, this.grassMaterial);
        rightGrass.rotation.x = -Math.PI / 2;
        rightGrass.position.x = this.roadWidth / 2 + grassWidth / 2 + 0.5;
        rightGrass.position.y = -0.01;
        rightGrass.receiveShadow = true;
        
        grassGroup.add(leftGrass);
        grassGroup.add(rightGrass);
        
        return grassGroup;
    }
    
    /**
     * Yol kenarı nesneleri oluştur
     */
    createRoadsideObjects(roadType) {
        const objectsGroup = new THREE.Group();
        
        // Ağaçlar
        const treeCount = MathUtils.randomInt(1, 3);
        for (let i = 0; i < treeCount; i++) {
            const tree = this.createTree();
            
            // Rastgele pozisyon (sol veya sağ)
            const side = Math.random() > 0.5 ? 1 : -1;
            tree.position.x = side * (this.roadWidth / 2 + MathUtils.random(5, 15));
            tree.position.z = MathUtils.random(-this.segmentLength / 2, this.segmentLength / 2);
            
            objectsGroup.add(tree);
        }
        
        return objectsGroup;
    }
    
    /**
     * Basit ağaç oluştur
     */
    createTree() {
        const treeGroup = new THREE.Group();
        
        // Gövde
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        
        // Yapraklar
        const leavesGeometry = new THREE.SphereGeometry(1.5);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 2.5;
        leaves.castShadow = true;
        
        treeGroup.add(trunk);
        treeGroup.add(leaves);
        
        return treeGroup;
    }
    
    /**
     * Yolu güncelle (oyuncu pozisyonuna göre)
     */
    update(playerPosition) {
        const playerZ = playerPosition.z;
        
        // Yeni segment'ler ekle (önde)
        while (this.getLastSegmentZ() < playerZ + (this.segmentsAhead * this.segmentLength)) {
            const newZ = this.getLastSegmentZ() + this.segmentLength;
            this.addRoadSegment(newZ);
        }
        
        // Eski segment'leri kaldır (arkada)
        while (this.getFirstSegmentZ() < playerZ - (this.segmentsBehind * this.segmentLength)) {
            this.removeFirstSegment();
        }
        
        this.lastPlayerZ = playerZ;
    }
    
    /**
     * Son segment'in Z pozisyonu
     */
    getLastSegmentZ() {
        if (this.segments.length === 0) return 0;
        return this.segments[this.segments.length - 1].userData.zPosition;
    }
    
    /**
     * İlk segment'in Z pozisyonu
     */
    getFirstSegmentZ() {
        if (this.segments.length === 0) return 0;
        return this.segments[0].userData.zPosition;
    }
    
    /**
     * İlk segment'i kaldır
     */
    removeFirstSegment() {
        if (this.segments.length > 0) {
            const segment = this.segments.shift();
            this.roadGroup.remove(segment);
            
            // Kaynakları temizle
            segment.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
    
    /**
     * Belirli bir pozisyonda yol var mı kontrol et
     */
    isOnRoad(position) {
        // Basit kontrol - x koordinatı yol genişliği içinde mi?
        return Math.abs(position.x) <= this.roadWidth / 2;
    }
    
    /**
     * Yol genişliğini al
     */
    getRoadWidth() {
        return this.roadWidth;
    }
    
    /**
     * Kaynakları temizle
     */
    dispose() {
        // Tüm segment'leri temizle
        this.segments.forEach(segment => {
            this.roadGroup.remove(segment);
            segment.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        
        this.segments = [];
        this.scene.remove(this.roadGroup);
        
        console.log('🗑️ Yol kaynakları temizlendi');
    }
}
