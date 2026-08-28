/**
 * Parser khusus untuk alamat Indonesia dari Nominatim OpenStreetMap
 * Struktur data Nominatim untuk Indonesia:
 * - state: Provinsi
 * - city / city_district: Kota/Kabupaten
 * - town / suburb: Kecamatan
 * - neighbourhood / village / hamlet: Kelurahan
 */
export const parseIndonesianAddress = (address) => {
  if (!address) return {};

  // === PROVINSI ===
  const provinsi = address.state || address.province || '';

  // === KOTA/KABUPATEN ===
  // Prioritas: city > county > municipality
  let city = address.city || address.county || address.municipality || '';
  
  // Bersihkan prefix "Kota " atau "Kabupaten " untuk konsistensi
  if (city.startsWith('Kota ')) city = city; // Biarkan "Kota Bandung"
  if (city.startsWith('Kabupaten ')) city = city; // Biarkan "Kabupaten Bandung"

  // === KECAMATAN ===
  // Prioritas: city_district > town > suburb (tapi suburb sering jadi kelurahan di Indonesia)
  let kecamatan = '';
  
  if (address.city_district) {
    kecamatan = address.city_district;
  } else if (address.town && address.town !== city) {
    kecamatan = address.town;
  } else if (address.suburb && address.suburb !== city) {
    // Di beberapa daerah, suburb adalah kecamatan
    // Cek: jika ada neighbourhood/village, maka suburb = kecamatan
    // Jika tidak ada, suburb kemungkinan = kelurahan
    if (address.neighbourhood || address.village || address.hamlet) {
      kecamatan = address.suburb;
    }
    // Jika tidak ada field kelurahan sama sekali, biarkan kecamatan kosong dulu
    // (akan diisi manual oleh user)
  }

  // === KELURAHAN ===
  // Prioritas: neighbourhood > village > hamlet > quarter
  let kelurahan = '';
  
  if (address.neighbourhood && address.neighbourhood !== kecamatan && address.neighbourhood !== city) {
    kelurahan = address.neighbourhood;
  } else if (address.village && address.village !== kecamatan && address.village !== city) {
    kelurahan = address.village;
  } else if (address.hamlet && address.hamlet !== kecamatan) {
    kelurahan = address.hamlet;
  } else if (address.quarter && address.quarter !== kecamatan) {
    kelurahan = address.quarter;
  } else if (address.suburb && address.suburb !== kecamatan && address.suburb !== city && !kecamatan) {
    // Fallback: jika tidak ada kecamatan yang terdeteksi, suburb = kelurahan
    kelurahan = address.suburb;
  }

  // === DETAIL ALAMAT LENGKAP ===
  // Gabungkan semua komponen menjadi alamat yang bisa dibaca
  const detailParts = [
    address.road,
    address.house_number,
    kelurahan,
    kecamatan,
    city,
    provinsi,
    address.postcode
  ].filter(Boolean);
  
  const detailAlamat = detailParts.join(', ');

  return {
    provinsi,
    city,
    kecamatan,
    kelurahan,
    detailAlamat
  };
};