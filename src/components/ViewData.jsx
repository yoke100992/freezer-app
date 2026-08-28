import React, { useState, useEffect } from 'react';
import { 
  Box, TextField, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Typography, Snackbar, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton, 
  Stack, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Download as DownloadIcon, Delete as DeleteIcon, FilterList as FilterIcon } from '@mui/icons-material';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { storage } from '../utils/storage';

export default function ViewData() {
  const [data, setData] = useState([]);
  const [filterNama, setFilterNama] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [loadingExport, setLoadingExport] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  useEffect(() => { setData(storage.getAssets()); }, []);
  const refreshData = () => setData(storage.getAssets());

  const filteredData = data.filter(item => 
    (filterNama === '' || item.nama === filterNama) && 
    (filterArea === '' || item.area === filterArea)
  );
  const uniqueNames = [...new Set(data.map(item => item.nama))];
  const uniqueAreas = [...new Set(data.map(item => item.area))];

  const handleOpenDelete = (id) => setDeleteDialog({ open: true, id });
  const handleConfirmDelete = () => {
    if (deleteDialog.id) { 
      storage.deleteAsset(deleteDialog.id); 
      refreshData(); 
      setSnackbar({ open: true, message: 'Data berhasil dihapus!', severity: 'success' }); 
    }
    setDeleteDialog({ open: false, id: null });
  };

  const fetchImageBuffer = async (url) => {
    try { 
      const response = await fetch(url); 
      const blob = await response.blob(); 
      return await blob.arrayBuffer(); 
    } catch (e) { return null; }
  };

  const handleExportExcel = async () => {
    setLoadingExport(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Freezer');
      worksheet.columns = [
        { header: 'Tanggal', key: 'tanggal', width: 20 }, 
        { header: 'Nama', key: 'nama', width: 15 }, 
        { header: 'Area', key: 'area', width: 15 },
        { header: 'Nama Toko', key: 'namaToko', width: 20 }, 
        { header: 'Provinsi', key: 'provinsi', width: 15 }, 
        { header: 'Kota', key: 'city', width: 15 },
        { header: 'Kecamatan', key: 'kecamatan', width: 15 }, 
        { header: 'Kelurahan', key: 'kelurahan', width: 15 }, 
        { header: 'Detail Alamat', key: 'detailAlamat', width: 30 },
        { header: 'Koordinat', key: 'koordinat', width: 20 }, 
        { header: 'Merk', key: 'merkFreezer', width: 15 }, 
        { header: 'No Asset', key: 'noAsset', width: 15 },
        { header: 'No Seri', key: 'noSeri', width: 15 }, 
        { header: 'Ukuran', key: 'ukuran', width: 15 }, 
        { header: 'Foto Asset', key: 'fotoAsset', width: 25 }, 
        { header: 'Foto Freezer', key: 'fotoFreezer', width: 25 },
      ];
      worksheet.eachRow((row) => { 
        row.eachCell((cell) => { 
          cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' }; 
        }); 
      });
      let currentRow = 2;
      for (const item of filteredData) {
        worksheet.addRow({ 
          tanggal: item.tanggal.replace('T', ' '), nama: item.nama, area: item.area, 
          namaToko: item.namaToko, provinsi: item.provinsi, city: item.city, 
          kecamatan: item.kecamatan, kelurahan: item.kelurahan, 
          detailAlamat: item.detailAlamat, koordinat: item.koordinat, 
          merkFreezer: item.merkFreezer, noAsset: item.noAsset, 
          noSeri: item.noSeri, ukuran: item.ukuran 
        });
        worksheet.getRow(currentRow).height = 100;
        if (item.fotoAsset) { 
          const imgBuffer = await fetchImageBuffer(item.fotoAsset); 
          if (imgBuffer) { 
            const imgId = workbook.addImage({ buffer: imgBuffer, extension: 'jpeg' }); 
            worksheet.addImage(imgId, { tl: { col: 14, row: currentRow - 1 }, ext: { width: 90, height: 90 } }); 
          } 
        }
        if (item.fotoFreezer) { 
          const imgBuffer = await fetchImageBuffer(item.fotoFreezer); 
          if (imgBuffer) { 
            const imgId = workbook.addImage({ buffer: imgBuffer, extension: 'jpeg' }); 
            worksheet.addImage(imgId, { tl: { col: 15, row: currentRow - 1 }, ext: { width: 90, height: 90 } }); 
          } 
        }
        currentRow++;
      }
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Data_Freezer_${new Date().toISOString().slice(0,10)}.xlsx`);
      setSnackbar({ open: true, message: 'Excel berhasil diunduh!', severity: 'success' });
    } catch (error) { 
      setSnackbar({ open: true, message: 'Gagal mengekspor Excel', severity: 'error' }); 
    } finally { 
      setLoadingExport(false); 
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: 'primary.main', mb: 3 }}>
        📊 View Data & Download
      </Typography>
      
      {/* 🔥 FILTER DENGAN SELECT + MENUITEM YANG STABIL */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3, 
        flexWrap: 'wrap', 
        alignItems: 'flex-start',
        p: 2,
        backgroundColor: '#F8FAFC',
        borderRadius: 3,
        border: '1px solid #E2E8F0'
      }}>
        <FormControl sx={{ minWidth: 180, flex: 1 }}>
          <InputLabel id="filter-nama-label">Filter Nama</InputLabel>
          <Select
            labelId="filter-nama-label"
            value={filterNama}
            label="Filter Nama"
            onChange={(e) => setFilterNama(e.target.value)}
            sx={{ borderRadius: 2, backgroundColor: 'white' }}
          >
            <MenuItem value="">
              <em>Semua Nama</em>
            </MenuItem>
            {uniqueNames.map(n => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 180, flex: 1 }}>
          <InputLabel id="filter-area-label">Filter Area</InputLabel>
          <Select
            labelId="filter-area-label"
            value={filterArea}
            label="Filter Area"
            onChange={(e) => setFilterArea(e.target.value)}
            sx={{ borderRadius: 2, backgroundColor: 'white' }}
          >
            <MenuItem value="">
              <em>Semua Area</em>
            </MenuItem>
            {uniqueAreas.map(a => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button 
          variant="contained" 
          startIcon={loadingExport ? <CircularProgress size={20} /> : <DownloadIcon />} 
          onClick={handleExportExcel} 
          disabled={loadingExport || filteredData.length === 0} 
          sx={{ borderRadius: 3, px: 3, py: 1.2, minWidth: 180 }}
        >
          {loadingExport ? 'Exporting...' : 'Download Excel'}
        </Button>
      </Box>

      {/* Info Jumlah Data */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
        Menampilkan <strong>{filteredData.length}</strong> dari <strong>{data.length}</strong> data
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
              {['Tanggal', 'Nama', 'Area', 'Toko', 'No Asset', 'Ukuran', 'Aksi'].map((h, i) => (
                <TableCell key={i} sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid #E2E8F0', py: 2 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Tidak ada data ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 }, transition: 'background 0.2s' }}>
                  <TableCell>{row.tanggal.replace('T', ' ')}</TableCell>
                  <TableCell>{row.nama}</TableCell>
                  <TableCell>{row.area}</TableCell>
                  <TableCell>{row.namaToko}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {row.noAsset}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.ukuran}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      onClick={() => handleOpenDelete(row.id)} 
                      color="error" 
                      size="small" 
                      sx={{ '&:hover': { backgroundColor: '#FEE2E2' } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, id: null })} 
        PaperProps={{ sx: { borderRadius: 4, minWidth: 320 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> Konfirmasi Hapus
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} variant="outlined" sx={{ borderRadius: 2 }}>
            Batal
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifikasi */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({...snackbar, open: false})} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})} sx={{ width: '100%', borderRadius: 3, boxShadow: 4 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}