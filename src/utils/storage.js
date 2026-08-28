// Simulasi database menggunakan localStorage browser
const getJSON = (key, defaultValue) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const storage = {
  // === ASSET ===
  getAssets: () => getJSON('asset.json', []),
  saveAsset: (asset) => {
    const assets = getJSON('asset.json', []);
    setJSON('asset.json', [...assets, asset]);
  },
  deleteAsset: (id) => {
    const assets = getJSON('asset.json', []);
    setJSON('asset.json', assets.filter(asset => asset.id !== id));
  },
  
  // === NAMA ===
  getNames: () => getJSON('nama.json', ['Yoke', 'Budi', 'Siti']),
  addName: (name) => {
    const names = getJSON('nama.json', []);
    if (!names.includes(name)) setJSON('nama.json', [...names, name]);
  },
  // 🔥 BARU: Update Nama
  updateName: (oldName, newName) => {
    let names = getJSON('nama.json', []);
    names = names.map(n => n === oldName ? newName : n);
    setJSON('nama.json', names);
  },
  // 🔥 BARU: Hapus Nama
  deleteName: (name) => {
    let names = getJSON('nama.json', []);
    setJSON('nama.json', names.filter(n => n !== name));
  },

  // === AREA ===
  getAreas: () => getJSON('area.json', ['Jakarta Pusat', 'Bandung', 'Surabaya']),
  addArea: (area) => {
    const areas = getJSON('area.json', []);
    if (!areas.includes(area)) setJSON('area.json', [...areas, area]);
  },
  // 🔥 BARU: Update Area
  updateArea: (oldArea, newArea) => {
    let areas = getJSON('area.json', []);
    areas = areas.map(a => a === oldArea ? newArea : a);
    setJSON('area.json', areas);
  },
  // 🔥 BARU: Hapus Area
  deleteArea: (area) => {
    let areas = getJSON('area.json', []);
    setJSON('area.json', areas.filter(a => a !== area));
  }
};