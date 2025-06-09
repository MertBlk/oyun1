import * as THREE from 'three';

/**
 * Sonsuz yol sistemi - prosedürel oluşturma
 */
export class Road {
    constructor(scene) {
        this.scene = scene;
        
        // GELİŞTİRİLMİŞ AYARLAR
        this.settings = {
            width: 7,                // Biraz daha geniş yol
            segmentLength: 15,       // Daha uzun segmentler (virajlar daha akıcı olur)
            segmentCount: 30,
            shoulderWidth: 1.5,      // Yol kenarı genişliği
            stripeDashLength: 3,     // Çizgi uzunluğu
            stripeDashGap: 2         // Çizgi aralığı
        };
        
        this.segments = {};
        this.currentSegmentIndex = 0;
        this.curvePoints = [];       // Viraj noktaları
        
        // GELİŞTİRİLMİŞ MATERYALLER
        this.createImprovedMaterials();
        
        // DAHA AKICI YOL OLUŞTUR
        this.generateSmoothRoad();
        
        console.log('🚗 GELİŞTİRİLMİŞ YOL SİSTEMİ HAZIR');
    }
    
    createImprovedMaterials() {
        // ASFALT - SİYAH AMA HAFIF DOKU İLE
        this.asphaltMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 }); // Biraz daha koyu
        
        // PARLAK BEYAZ ÇİZGİ
        this.whiteLineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        // PARLAK SARI ÇİZGİ
        this.yellowLineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        
        // YOL KENARI (AÇIK GRİ)
        this.shoulderMaterial = new THREE.MeshBasicMaterial({ color: 0x777777 });
        
        // ÇİMEN KENARI
        this.grassMaterial = new THREE.MeshBasicMaterial({ color: 0x477D35 });
    }
    
    // Daha yumuşak virajlar için sinüs fonksiyonunu kullanalım
    generateSmoothRoad() {
    // HAFİF VİRAJLI YOL OLUŞTUR
        // Viraj parametreleri
        const amplitude = 30;       // 15'den 30'a çıkarıldı - DAHA BELİRGİN VİRAJLAR
        const period = 30;         // 50'den 30'a düşürüldü - DAHA SIK VİRAJLAR
        const secondaryPeriod = 15; // 20'den 15'e düşürüldü
        
        // İlk 300 segment için virajlı yol noktaları oluştur
        for (let i = 0; i < 300; i++) {
            // Ana viraj paterni (uzun dalgalar)
            const mainCurve = Math.sin(i / period) * amplitude;
            
            // İkincil viraj paterni (kısa dalgalar)
            const secondaryCurve = Math.sin(i / secondaryPeriod) * (amplitude / 3); // 1/4 yerine 1/3
            
            // Toplam viraj değeri
            const totalCurve = mainCurve + secondaryCurve;
            
            this.curvePoints.push({
                index: i,
                x: totalCurve, // Virajlı yol - sin fonksiyonu
                z: i * this.settings.segmentLength
            });
        }
        
        // İlk 30 segmenti oluştur
        for (let i = 0; i < 30; i++) {
            this.createSmoothSegment(i);
        }
    }
    
    // Daha yumuşak virajlı segment - GELİŞTİRİLMİŞ SÜRÜM
    createSmoothSegment(index) {
        const group = new THREE.Group();
        const startZ = index * this.settings.segmentLength;
        
        // Viraj noktası al
        const point = this.curvePoints[index];
        const nextPoint = this.curvePoints[index + 1] || point;
        const prevPoint = this.curvePoints[index - 1] || point;
        
        // X pozisyonu - DAHA YUMUŞAK VİRAJ
        const xPos = point.x;
        const nextXPos = nextPoint.x;
        
        // Önceki segment ile birleştirme için tansiyon hesabı
        const prevTangent = index > 0 ? (xPos - prevPoint.x) : 0;
        const nextTangent = (nextXPos - xPos);
        
        // Viraj açısı hesapla - DAHA HASSAS
        const angle = Math.atan2(nextXPos - xPos, this.settings.segmentLength);
        
        // YOL YÜKSELTİ HESABI - DAHA DÜŞÜK DEĞERLER
        const baseElevation = 0; // Tamamen düz yol
        
        // ASFALT - SİYAH YOL - DAHA SİYAH
        this.asphaltMaterial.color.set(0x050505); // DAHA KOYU SİYAH
        const roadGeometry = new THREE.BoxGeometry(
            this.settings.width, 
            0.1, 
            this.settings.segmentLength * 1.1 // %10 daha uzun (daha fazla örtüşme)
        );
        const roadMesh = new THREE.Mesh(roadGeometry, this.asphaltMaterial);
        roadMesh.position.set(
            xPos,
            baseElevation, 
            startZ + this.settings.segmentLength/2 + 0.05 // Hafif ileri pozisyon
        );
        roadMesh.rotation.y = angle; // Viraj açısı
        roadMesh.rotation.x = Math.atan2(nextPoint.x - point.x, this.settings.segmentLength) * 0.05; // Eğim
        group.add(roadMesh);
        
        // YOL KENARLARI - GRİ BANTLAR - DAHA GENİŞ
        [-this.settings.width/2 - this.settings.shoulderWidth/2, 
         this.settings.width/2 + this.settings.shoulderWidth/2].forEach(shoulderX => {
            const shoulderGeometry = new THREE.BoxGeometry(
                this.settings.shoulderWidth, 0.08, this.settings.segmentLength * 1.01
            );
            const shoulderMesh = new THREE.Mesh(shoulderGeometry, this.shoulderMaterial);
            
            // Viraj açısına göre pozisyon ayarla - GELİŞTİRİLMİŞ
            const shiftedX = shoulderX * Math.cos(angle);
            const shiftedZ = shoulderX * Math.sin(angle);
            
            shoulderMesh.position.set(
                xPos + shiftedX, 
                baseElevation - 0.01, // Asfaltın hemen altında
                startZ + this.settings.segmentLength/2 - shiftedZ
            );
            shoulderMesh.rotation.y = angle;
            shoulderMesh.rotation.x = roadMesh.rotation.x; // Aynı eğim
            group.add(shoulderMesh);
        });
        
        // YOL ORTA ÇİZGİSİ - PARLAK SARI KESİKLİ - DAHA PARLAK VE DÜZGÜN
        const dashCount = Math.floor(this.settings.segmentLength / 
                                    (this.settings.stripeDashLength + this.settings.stripeDashGap));
        for (let i = 0; i < dashCount; i++) {
            const dashStart = i * (this.settings.stripeDashLength + this.settings.stripeDashGap);
            const dashZ = startZ + dashStart + this.settings.stripeDashLength/2;
            
            // Tam ortalanmış çizgi pozisyonu
            const dashProgress = (dashZ - startZ) / this.settings.segmentLength;
            const lerpedX = xPos + (nextXPos - xPos) * dashProgress;
    
            const centerLineGeometry = new THREE.BoxGeometry(
                0.15, 0.15, this.settings.stripeDashLength * 0.9 // Y yüksekliği artırıldı
            );
            const centerLineMesh = new THREE.Mesh(centerLineGeometry, this.yellowLineMaterial);
            
            // Viraj doğrultusunda dönüş
            const localAngle = Math.atan2(
                nextXPos - xPos, 
                this.settings.segmentLength
            );
            
            centerLineMesh.position.set(lerpedX, baseElevation + 0.08, dashZ); // Yüksekliği artırıldı
            centerLineMesh.rotation.y = localAngle;
            group.add(centerLineMesh);
        }
        
        // KENAR ÇİZGİLERİ - PARLAK BEYAZ - DAHA GENİŞ VE PARLAK
        [-this.settings.width/2 + 0.1, this.settings.width/2 - 0.1].forEach(offsetX => {
            // Her kenar için 3 segment - daha akıcı görünüm
            const edgeSegments = 3;
            for (let i = 0; i < edgeSegments; i++) {
                const segStart = i * (this.settings.segmentLength / edgeSegments);
                const segEnd = (i + 1) * (this.settings.segmentLength / edgeSegments);
                const segLength = segEnd - segStart;
                const segMidZ = startZ + segStart + segLength/2;
                
                // Bu segment için interpole edilmiş X pozisyonu
                const segStartProgress = segStart / this.settings.segmentLength;
                const segEndProgress = segEnd / this.settings.segmentLength;
                const segStartX = xPos + (nextXPos - xPos) * segStartProgress;
                const segEndX = xPos + (nextXPos - xPos) * segEndProgress;
                const segMidX = (segStartX + segEndX) / 2;
                
                const edgeLineGeometry = new THREE.BoxGeometry(0.13, 0.12, segLength * 0.98);
                const edgeLineMesh = new THREE.Mesh(edgeLineGeometry, this.whiteLineMaterial);
                
                // Viraj açısına göre pozisyon ve rotasyon
                const localAngle = Math.atan2(segEndX - segStartX, segLength);
                const shiftedX = offsetX * Math.cos(localAngle);
                const shiftedZ = offsetX * Math.sin(localAngle);
                
                edgeLineMesh.position.set(
                    segMidX + shiftedX, 
                    baseElevation + 0.06, // Asfaltın biraz üstünde
                    segMidZ - shiftedZ
                );
                edgeLineMesh.rotation.y = localAngle;
                group.add(edgeLineMesh);
            }
        });
        
        // YOL KENARINA AĞAÇLAR EKLE
        if (index % 3 === 0) { // Her 3 segmentte bir
            [-25, 25].forEach(offsetX => { // 15 yerine 25 - DAHA UZAĞA YERLEŞTİR
                // Basit ağaç geometrisi
                const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3, 8);
                const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                
                const leavesGeometry = new THREE.SphereGeometry(2, 8, 8);
                const leavesMaterial = new THREE.MeshBasicMaterial({ color: 0x006400 });
                const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
                leaves.position.y = 2.5;
                
                const tree = new THREE.Group();
                tree.add(trunk);
                tree.add(leaves);
                
                // DÜZ YOL için ağaç konumu
                const randomOffset = (Math.random() - 0.5) * 8; // 5 yerine 8 - DAHA GENİŞ DAĞILIM
                const treeX = xPos + offsetX + randomOffset; // xPos ekledik! - VİRAJ TAKİP ETSİN
                const treeZ = startZ + Math.random() * this.settings.segmentLength;
                
                tree.position.set(treeX, 0, treeZ);
                group.add(tree);
            });
        }
        
        // YOL KENARINA KÜÇÜK TABELALAR EKLE
        if (index % 5 === 0) { // Her 5 segmentte bir
            const signPostGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
            const signPostMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
            const signPost = new THREE.Mesh(signPostGeometry, signPostMaterial);
            
            const signGeometry = new THREE.BoxGeometry(1, 0.7, 0.1);
            const signMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.y = 1.2;
            
            const signGroup = new THREE.Group();
            signGroup.add(signPost);
            signGroup.add(sign);
            
            const signSide = Math.random() > 0.5 ? 1 : -1;
            const signX = xPos + (this.settings.width/2 + 1.5) * signSide;
            const signZ = startZ + Math.random() * this.settings.segmentLength;
            
            signGroup.position.set(signX, 0, signZ);
            group.add(signGroup);
        }
        
        this.segments[index] = group;
        this.scene.add(group);
    }
    
    update(vehiclePosition) {
        // Debug bilgisi ekle
        console.log(`🚗 Araç pozisyonu: Z=${vehiclePosition.z}, segment=${Math.floor(vehiclePosition.z / this.settings.segmentLength)}`);
        
        // Basit segment yönetimi
        const vehicleZ = vehiclePosition.z;
        const currentSegmentIndex = Math.floor(vehicleZ / this.settings.segmentLength);
        
        // YENİ: İhtiyaç oldukça daha fazla virajlı curvePoints ekle
        const requiredPoints = currentSegmentIndex + 35; // 35 segment ilerisi için gerekli
        if (requiredPoints >= this.curvePoints.length) {
            // Daha fazla virajlı yol noktası oluştur - DAHA BELİRGİN VİRAJLAR!
            for (let i = this.curvePoints.length; i <= requiredPoints; i++) {
                const amplitude = 30;       // VİRAJ GENİŞLİĞİ ARTIRILDI
                const period = 30;         // VİRAJ SIKLIĞI ARTIRILDI
                const secondaryPeriod = 15;
                    
                // Ana viraj paterni (uzun dalgalar)
                const mainCurve = Math.sin(i / period) * amplitude;
                
                // İkincil viraj paterni (kısa dalgalar) - GÜÇLÜ
                const secondaryCurve = Math.sin(i / secondaryPeriod) * (amplitude / 3);
                
                // Toplam viraj değeri
                const totalCurve = mainCurve + secondaryCurve;
                
                this.curvePoints.push({
                    index: i,
                    x: totalCurve, // Virajlı yol - sin fonksiyonu - GÜÇLÜ
                    z: i * this.settings.segmentLength
                });
            }
        }
        
        // İleride YENİ segmentler oluştur - DAHA FAZLA SEGMENT
        for (let i = currentSegmentIndex; i <= currentSegmentIndex + 30; i++) {
            if (i >= 0 && !this.segments[i]) {
                this.createSmoothSegment(i);
            }
        }
        
        // Geride kalan segmentleri kaldır - DAHA GEÇ SİL
        for (let i in this.segments) {
            if (i < currentSegmentIndex - 15) {
                this.scene.remove(this.segments[i]);
                this.segments[i].traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                });
                delete this.segments[i];
            }
        }
        
        this.currentSegmentIndex = currentSegmentIndex;
    }
    
    dispose() {
        Object.values(this.segments).forEach(segment => {
            this.scene.remove(segment);
            segment.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        
        this.asphaltMaterial.dispose();
        this.whiteLineMaterial.dispose();
        this.yellowLineMaterial.dispose();
        this.shoulderMaterial.dispose();
        this.grassMaterial.dispose();
    }
}
