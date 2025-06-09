# 🚗 3D Araba Sürüş Oyunu

Three.js kullanılarak geliştirilmiş, web tarayıcısı üzerinde çalışan modern 3D araba sürüş oyunu.

## 🎮 Özellikler

### Temel Özellikler
- **Gerçekçi 3D Grafikleri**: Three.js ile geliştirilmiş modern grafik sistemi
- **Dinamik Yol Oluşturma**: Her oyunda farklı yol deneyimi
- **Akıllı Kamera Sistemi**: 3 farklı kamera modu (Third Person, First Person, Cinematic)
- **Responsive Tasarım**: Masaüstü ve mobil cihazlarda çalışır
- **Gerçekçi Fizik**: Araç fiziği ve kontrol sistemi

### Kontroller
- **W/↑**: İleri git
- **S/↓**: Geri git
- **A/←**: Sola dön
- **D/→**: Sağa dön
- **Space**: El freni
- **C**: Kamera modu değiştir
- **H**: Talimatları göster/gizle
- **U**: UI'yi gizle/göster
- **P**: Performans modunu aç/kapat
- **F11**: Tam ekran
- **F12**: Debug panel
- **F9**: Ekran görüntüsü al
- **Esc**: Oyunu duraklat

### Teknik Özellikler
- **Modüler Mimari**: Genişletilebilir ve sürdürülebilir kod yapısı
- **Performans Optimizasyonu**: 60 FPS hedefiyle optimize edilmiş
- **Cross-Platform**: Tüm modern tarayıcılarda çalışır
- **WebGL**: Donanım hızlandırmalı grafik işleme

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)
- WebGL desteği
- JavaScript etkinleştirilmiş olmalı

### Yerel Çalıştırma

1. **Dosyaları indirin**:
   ```bash
   git clone [proje-url]
   cd oyun1
   ```

2. **Yerel sunucu başlatın**:
   ```bash
   # Python ile
   python -m http.server 8000
   
   # Node.js ile
   npx serve .
   
   # PHP ile
   php -S localhost:8000
   ```

3. **Tarayıcıda açın**:
   ```
   http://localhost:8000
   ```

### Direkt Çalıştırma
HTML dosyasını doğrudan tarayıcıda açmak da mümkündür, ancak bazı özellikler yerel sunucu gerektirebilir.

## 📁 Proje Yapısı

```
oyun1/
├── index.html              # Ana HTML dosyası
├── README.md              # Bu dosya
└── js/                    # JavaScript dosyaları
    ├── main.js           # Ana oyun başlatma
    ├── core/             # Oyun motoru
    │   └── GameEngine.js
    ├── vehicle/          # Araç sistemi
    │   └── Vehicle.js
    ├── world/            # Dünya ve çevre
    │   ├── Road.js
    │   └── Environment.js
    ├── controls/         # Kontrol sistemi
    │   └── InputController.js
    ├── camera/           # Kamera sistemi
    │   └── CameraController.js
    ├── ui/               # Kullanıcı arayüzü
    │   └── UIManager.js
    └── utils/            # Yardımcı fonksiyonlar
        └── MathUtils.js
```

## 🛠️ Geliştirme

### Mimari
Oyun modüler bir yapı kullanır:

- **GameEngine**: Ana oyun döngüsü ve sistem yönetimi
- **Vehicle**: Araç fiziği ve kontrolü
- **Road**: Dinamik yol oluşturma sistemi
- **Environment**: Çevre ve atmosfer efektleri
- **CameraController**: Kamera hareketleri ve modları
- **InputController**: Kullanıcı girdi yönetimi
- **UIManager**: Kullanıcı arayüzü
- **MathUtils**: Matematik yardımcı fonksiyonları

### Genişletme Planları

#### Yakın Dönem
- [ ] Çoklu araç modelleri
- [ ] Yol trafik işaretleri
- [ ] Ses sistemi entegrasyonu
- [ ] Partiküler efektler (toz, duman)
- [ ] Çarpışma sistemi

#### Orta Dönem
- [ ] GLTF/OBJ model desteği
- [ ] Gelişmiş yol tipleri (kavşak, köprü)
- [ ] Hava durumu sistemi
- [ ] Gün/gece döngüsü
- [ ] Yakıt sistemi

#### Uzun Dönem
- [ ] Çoklu oyuncu desteği
- [ ] Spotify API entegrasyonu
- [ ] VR desteği
- [ ] Mobil uygulama
- [ ] Yapay zeka rakipler

## 🎯 Performans İpuçları

### Optimizasyonlar
- **Performans Modu**: Gölge ve efektleri kapatır
- **LOD Sistemi**: Uzak nesneler için basit modeller
- **Frustum Culling**: Görünmeyen nesneleri render etmez
- **Object Pooling**: Nesneleri yeniden kullanır

### Sistem Gereksinimleri
- **Minimum**: Intel HD 4000 / GT 730M, 4GB RAM
- **Önerilen**: GTX 1050 / RX 560, 8GB RAM
- **İdeal**: GTX 1660 / RX 580, 16GB RAM

## 🔧 Konfigürasyon

### Oyun Ayarları
Oyun ayarları `GameEngine.js` dosyasında yapılandırılabilir:

```javascript
this.settings = {
    graphics: {
        antialias: true,    // Anti-aliasing
        shadows: true,      // Gölgeler
        fog: true          // Sis efekti
    },
    physics: {
        gravity: -9.81,     // Yerçekimi
        friction: 0.8       // Sürtünme
    },
    camera: {
        fov: 75,           // Görüş açısı
        near: 0.1,         // Yakın kesim
        far: 1000          // Uzak kesim
    }
};
```

## 🐛 Bilinen Sorunlar

- Safari'de bazı shader'lar düzgün çalışmayabilir
- Eski Android cihazlarda performans düşük olabilir
- Firefox'ta tam ekran modunda bazı tuşlar çalışmayabilir

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir. Three.js MIT lisansı altında kullanılmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/YeniOzellik`)
3. Commit yapın (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'i push edin (`git push origin feature/YeniOzellik`)
5. Pull Request oluşturun

## 📞 İletişim

Sorular, öneriler ve hata raporları için:
- GitHub Issues kullanın
- Code review'lar memnuniyetle karşılanır

## 🙏 Teşekkürler

- **Three.js**: Harika 3D kütüphanesi için
- **Web**: Modern web standartları için
- **Community**: Açık kaynak topluluğu için

---

**İyi Oyunlar! 🏁**
