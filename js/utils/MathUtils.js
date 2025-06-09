/**
 * Oyun için gerekli matematik yardımcı fonksiyonları
 */
export class MathUtils {
    /**
     * İki sayı arasında linear interpolation (lerp)
     * @param {number} start - Başlangıç değeri
     * @param {number} end - Bitiş değeri
     * @param {number} factor - Interpolation faktörü (0-1)
     * @returns {number}
     */
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    /**
     * Bir değeri belirli aralıkta sınırla
     * @param {number} value - Sınırlanacak değer
     * @param {number} min - Minimum değer
     * @param {number} max - Maksimum değer
     * @returns {number}
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Radyan'dan derece'ye çevir
     * @param {number} radians - Radyan değeri
     * @returns {number}
     */
    static toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * Derece'den radyan'a çevir
     * @param {number} degrees - Derece değeri
     * @returns {number}
     */
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * İki nokta arasındaki mesafeyi hesapla
     * @param {THREE.Vector3} point1 - İlk nokta
     * @param {THREE.Vector3} point2 - İkinci nokta
     * @returns {number}
     */
    static distance(point1, point2) {
        return point1.distanceTo(point2);
    }

    /**
     * Rastgele sayı üret (min ve max dahil)
     * @param {number} min - Minimum değer
     * @param {number} max - Maksimum değer
     * @returns {number}
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Rastgele tam sayı üret
     * @param {number} min - Minimum değer
     * @param {number} max - Maksimum değer
     * @returns {number}
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Smooth step function - yumuşak geçiş için
     * @param {number} edge0 - Alt sınır
     * @param {number} edge1 - Üst sınır
     * @param {number} x - Giriş değeri
     * @returns {number}
     */
    static smoothStep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }

    /**
     * Bir açıyı -PI ile PI arasında normalize et
     * @param {number} angle - Normalize edilecek açı
     * @returns {number}
     */
    static normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * Vector3'ü düz zeminde normalize et (y=0)
     * @param {THREE.Vector3} vector - Normalize edilecek vektör
     * @returns {THREE.Vector3}
     */
    static normalizeOnPlane(vector) {
        const normalized = vector.clone();
        normalized.y = 0;
        normalized.normalize();
        return normalized;
    }
}
