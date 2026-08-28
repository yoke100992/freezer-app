import React, { useState } from 'react';
import { Box, TextField, Button, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Autocomplete, Snackbar, Alert, CircularProgress, Paper, Typography } from '@mui/material';
import { MyLocation as LocationIcon, CloudUpload as CloudUploadIcon, PhotoCamera } from '@mui/icons-material';
import { storage } from '../utils/storage';
import { uploadImage } from '../utils/cloudinary';

// 🔥 HELPER BARU: Mengambil Waktu Lokal (Bukan UTC)
const getLocalDateTime = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const toProperCase = (str) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
const parseAddressFromDisplayName = (displayName) => {
  if (!displayName) return { kecamatan: '', kelurahan: '', city: '', provinsi: '' };
  const parts = displayName.split(',').map(p => p.trim());
  return { kelurahan: parts[0] || '', kecamatan: parts[1] || '', city: parts[2] || '', provinsi: parts[3] || '' };
};

const compressImage = (file, maxWidth = 1024, maxHeight = 1024, quality = 0.6) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > height) { if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; } } 
        else { if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() })), 'image/jpeg', quality);
      };
    };
  });
};

export default function InputData({ onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 🔥 PERBAIKAN: Menggunakan getLocalDateTime()
  const [formData, setFormData] = useState({
    tanggal: getLocalDateTime(), 
    nama: '', area: '', namaToko: '', provinsi: '', city: '', kecamatan: '', kelurahan: '', detailAlamat: '', koordinat: '', merkFreezer: '', noAsset: '', noSeri: '', ukuran: '300L', ukuranOther: '', fotoAsset: null, fotoFreezer: null,
  });
  const [previewAsset, setPreviewAsset] = useState('');
  const [previewFreezer, setPreviewFreezer] = useState('');

  const names = storage.getNames();
  const areas = storage.getAreas();

  const handleLocation = () => {
    if (!navigator.geolocation) { showSnackbar('Geolocation tidak didukung', 'error'); return; }
    showSnackbar('Mengambil lokasi...', 'info');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setFormData(prev => ({ ...prev, koordinat: `${latitude}, ${longitude}` }));
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`, { headers: { 'User-Agent': 'FreezerApp/1.0' } });
        const data = await res.json();
        const addr = data.address || {};
        const parsed = parseAddressFromDisplayName(data.display_name);
        const provinsi = addr.state || addr.province || parsed.provinsi || '';
        const city = addr.city || addr.county || addr.municipality || parsed.city || '';
        const kecamatan = parsed.kecamatan || addr.city_district || addr.town || (addr.suburb && addr.suburb !== addr.neighbourhood ? addr.suburb : '') || '';
        const kelurahan = parsed.kelurahan || addr.neighbourhood || addr.village || addr.hamlet || addr.quarter || '';
        const detailParts = [addr.road, addr.house_number, kelurahan, kecamatan, city, provinsi, addr.postcode].filter(Boolean);
        setFormData(prev => ({ ...prev, provinsi: toProperCase(provinsi), city: toProperCase(city), kecamatan: toProperCase(kecamatan), kelurahan: toProperCase(kelurahan), detailAlamat: detailParts.join(', ') || data.display_name || '' }));
        showSnackbar('Lokasi berhasil diambil!', 'success');
      } catch (err) { showSnackbar('Gagal mengambil alamat', 'error'); }
    }, (error) => showSnackbar('Izin lokasi ditolak', 'error'));
  };

  const handleFileChange = async (e, field, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setCompressing(true);
      try {
        const compressedFile = await compressImage(file, 1024, 1024, 0.6);
        setFormData(prev => ({ ...prev, [field]: compressedFile }));
        setPreview(URL.createObjectURL(compressedFile));
        const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
        showSnackbar(`🗜️ Foto dikompres (-${reduction}%)`, 'info');
      } catch (error) { setFormData(prev => ({ ...prev, [field]: file })); setPreview(URL.createObjectURL(file)); } 
      finally { setCompressing(false); }
    }
  };

  const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.area || !formData.namaToko || !formData.noAsset || !formData.fotoAsset || !formData.fotoFreezer) { showSnackbar('Harap isi semua field wajib!', 'error'); return; }
    setLoading(true);
    try {
      showSnackbar('Mengupload foto...', 'info');
      const urlAsset = await uploadImage(formData.fotoAsset);
      const urlFreezer = await uploadImage(formData.fotoFreezer);
      if (!urlAsset || !urlFreezer) throw new Error('Gagal upload gambar');
      const finalData = { ...formData, ukuran: formData.ukuran === 'other' ? formData.ukuranOther : formData.ukuran, fotoAsset: urlAsset, fotoFreezer: urlFreezer, id: Date.now().toString() };
      storage.saveAsset(finalData);
      showSnackbar('✅ Data berhasil disimpan!', 'success');
      onRefresh();
      
      //  PERBAIKAN: Reset waktu juga menggunakan waktu lokal
      setFormData({ 
        tanggal: getLocalDateTime(), 
        nama: '', area: '', namaToko: '', provinsi: '', city: '', kecamatan: '', kelurahan: '', detailAlamat: '', koordinat: '', merkFreezer: '', noAsset: '', noSeri: '', ukuran: '300L', ukuranOther: '', fotoAsset: null, fotoFreezer: null 
      });
      setPreviewAsset(''); setPreviewFreezer('');
    } catch (error) { showSnackbar('❌ ' + (error.message || 'Terjadi kesalahan'), 'error'); } 
    finally { setLoading(false); }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: 'primary.main', mb: 3 }}>📝 Input Data Freezer</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        
        <TextField label="Tanggal & Waktu" type="datetime-local" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} InputLabelProps={{ shrink: true }} required fullWidth />
        <Autocomplete options={names} renderInput={(params) => <TextField {...params} label="Nama" required />} value={formData.nama} onChange={(e, val) => setFormData({...formData, nama: val})} />
        <Autocomplete options={areas} renderInput={(params) => <TextField {...params} label="Area" required />} value={formData.area} onChange={(e, val) => setFormData({...formData, area: val})} />
        <TextField label="Nama Toko" required value={formData.namaToko} onChange={e => setFormData({...formData, namaToko: toProperCase(e.target.value)})} placeholder="Contoh: Toko Sejahtera" fullWidth />
        
        <Button variant="outlined" startIcon={<LocationIcon />} onClick={handleLocation} sx={{ py: 1.5, borderRadius: 3, borderWidth: 2 }}>Ambil Lokasi Otomatis</Button>

        <TextField label="Provinsi" value={formData.provinsi} onChange={e => setFormData({...formData, provinsi: e.target.value})} fullWidth />
        <TextField label="City/Kabupaten" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} fullWidth />
        <TextField label="Kecamatan" value={formData.kecamatan} onChange={e => setFormData({...formData, kecamatan: toProperCase(e.target.value)})} fullWidth />
        <TextField label="Kelurahan" value={formData.kelurahan} onChange={e => setFormData({...formData, kelurahan: toProperCase(e.target.value)})} fullWidth />
        <TextField label="Detail Alamat" value={formData.detailAlamat} onChange={e => setFormData({...formData, detailAlamat: e.target.value})} multiline rows={2} fullWidth />
        <TextField label="Koordinat" value={formData.koordinat} onChange={e => setFormData({...formData, koordinat: e.target.value})} fullWidth />

        <TextField label="Merk Freezer" value={formData.merkFreezer} onChange={e => setFormData({...formData, merkFreezer: toProperCase(e.target.value)})} placeholder="Contoh: Diamond, Samsung" fullWidth />
        <TextField label="No Asset" type="text" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} value={formData.noAsset} onChange={e => setFormData({...formData, noAsset: e.target.value.replace(/\D/g, '')})} required fullWidth />
        <TextField label="No Seri (Opsional)" type="text" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} value={formData.noSeri} onChange={e => setFormData({...formData, noSeri: e.target.value.replace(/\D/g, '')})} fullWidth />

        <FormControl component="fieldset" sx={{ mt: 1 }}>
          <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Ukuran Freezer</FormLabel>
          <RadioGroup row value={formData.ukuran} onChange={e => setFormData({...formData, ukuran: e.target.value})}>
            <FormControlLabel value="300L" control={<Radio />} label="300L" />
            <FormControlLabel value="600L" control={<Radio />} label="600L" />
            <FormControlLabel value="other" control={<Radio />} label="Other" />
          </RadioGroup>
          {formData.ukuran === 'other' && <TextField size="small" label="Ukuran Manual" value={formData.ukuranOther} onChange={e => setFormData({...formData, ukuranOther: e.target.value})} sx={{ mt: 1 }} fullWidth />}
        </FormControl>

        <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 3, p: 3, textAlign: 'center', backgroundColor: '#F8FAFC', transition: '0.3s', '&:hover': { borderColor: '#2563EB', backgroundColor: '#EFF6FF' } }}>
          <PhotoCamera sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="body2" fontWeight="bold" gutterBottom>Foto No Asset *</Typography>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'fotoAsset', setPreviewAsset)} required disabled={compressing} style={{ width: '100%' }} />
          {compressing && <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>Sedang mengkompres...</Typography>}
          {previewAsset && <img src={previewAsset} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', marginTop: 12, borderRadius: 12, border: '1px solid #E2E8F0' }} />}
        </Box>

        <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 3, p: 3, textAlign: 'center', backgroundColor: '#F8FAFC', transition: '0.3s', '&:hover': { borderColor: '#2563EB', backgroundColor: '#EFF6FF' } }}>
          <PhotoCamera sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="body2" fontWeight="bold" gutterBottom>Foto Freezer *</Typography>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'fotoFreezer', setPreviewFreezer)} required disabled={compressing} style={{ width: '100%' }} />
          {compressing && <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>Sedang mengkompres...</Typography>}
          {previewFreezer && <img src={previewFreezer} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', marginTop: 12, borderRadius: 12, border: '1px solid #E2E8F0' }} />}
        </Box>

        <Button type="submit" variant="contained" size="large" disabled={loading || compressing} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />} sx={{ mt: 2, py: 1.8, borderRadius: 3, fontSize: '1.1rem' }}>
          {loading ? 'Menyimpan...' : 'Simpan Data'}
        </Button>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})} sx={{ width: '100%', maxWidth: 400, borderRadius: 3, boxShadow: 4 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Paper>
  );
}