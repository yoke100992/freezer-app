import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { storage } from '../utils/storage';

export default function Settings() {
  const [names, setNames] = useState([]);
  const [areas, setAreas] = useState([]);
  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editDialog, setEditDialog] = useState({ open: false, type: '', oldValue: '', newValue: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', value: '' });

  useEffect(() => { refreshData(); }, []);
  const refreshData = () => { setNames(storage.getNames()); setAreas(storage.getAreas()); };
  const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

  const handleAddName = () => { if (!newName.trim()) return; storage.addName(newName.trim()); refreshData(); setNewName(''); showSnackbar('Nama berhasil ditambahkan', 'success'); };
  const handleAddArea = () => { if (!newArea.trim()) return; storage.addArea(newArea.trim()); refreshData(); setNewArea(''); showSnackbar('Area berhasil ditambahkan', 'success'); };

  const handleOpenEdit = (type, value) => setEditDialog({ open: true, type, oldValue: value, newValue: value });
  const handleSaveEdit = () => {
    const { type, oldValue, newValue } = editDialog;
    const trimmedValue = newValue.trim();
    if (!trimmedValue) { showSnackbar('Nilai tidak boleh kosong!', 'error'); return; }
    const currentData = type === 'nama' ? names : areas;
    if (currentData.includes(trimmedValue) && trimmedValue !== oldValue) { showSnackbar('Data sudah ada!', 'error'); return; }
    if (type === 'nama') storage.updateName(oldValue, trimmedValue); else storage.updateArea(oldValue, trimmedValue);
    refreshData(); setEditDialog({ ...editDialog, open: false }); showSnackbar('Data berhasil diperbarui!', 'success');
  };

  const handleOpenDelete = (type, value) => setDeleteDialog({ open: true, type, value });
  const handleConfirmDelete = () => {
    const { type, value } = deleteDialog;
    if (type === 'nama') storage.deleteName(value); else storage.deleteArea(value);
    refreshData(); setDeleteDialog({ open: false, type: '', value: '' }); showSnackbar('Data berhasil dihapus!', 'success');
  };

  const renderTable = (data, type) => (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, borderRadius: 3, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid #E2E8F0' }}>{type === 'nama' ? 'Nama' : 'Area'}</TableCell>
            <TableCell align="right" sx={{ minWidth: 100, fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid #E2E8F0' }}>Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? <TableRow><TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>Belum ada data</TableCell></TableRow> : 
            data.map((item, idx) => (
              <TableRow key={idx} hover sx={{ transition: 'background 0.2s' }}>
                <TableCell>{item}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(type, item)} sx={{ '&:hover': { backgroundColor: '#EFF6FF' } }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleOpenDelete(type, item)} sx={{ '&:hover': { backgroundColor: '#FEE2E2' } }}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Paper sx={{ p: 3, borderRadius: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: 'primary.main', mb: 3 }}>⚙️ Settings (Master Data)</Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Daftar Nama</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField size="small" label="Nama Baru" value={newName} onChange={e => setNewName(e.target.value)} sx={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && handleAddName()} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddName} sx={{ borderRadius: 3 }}>Tambah</Button>
          </Box>
          {renderTable(names, 'nama')}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Daftar Area</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField size="small" label="Area Baru" value={newArea} onChange={e => setNewArea(e.target.value)} sx={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && handleAddArea()} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddArea} sx={{ borderRadius: 3 }}>Tambah</Button>
          </Box>
          {renderTable(areas, 'area')}
        </Box>
      </Box>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({...editDialog, open: false})} PaperProps={{ sx: { borderRadius: 4, minWidth: 320 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}><EditIcon color="primary" /> Edit {editDialog.type === 'nama' ? 'Nama' : 'Area'}</DialogTitle>
        <DialogContent><TextField autoFocus margin="dense" label={`Ubah ${editDialog.type === 'nama' ? 'Nama' : 'Area'}`} type="text" fullWidth variant="outlined" value={editDialog.newValue} onChange={e => setEditDialog({...editDialog, newValue: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} /></DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setEditDialog({...editDialog, open: false})} variant="outlined" sx={{ borderRadius: 2 }}>Batal</Button><Button onClick={handleSaveEdit} variant="contained" sx={{ borderRadius: 2 }}>Simpan</Button></DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({...deleteDialog, open: false})} PaperProps={{ sx: { borderRadius: 4, minWidth: 320 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}><DeleteIcon /> Konfirmasi Hapus</DialogTitle>
        <DialogContent><Typography>Apakah Anda yakin ingin menghapus <strong>"{deleteDialog.value}"</strong>?</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Tindakan ini tidak dapat dibatalkan.</Typography></DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setDeleteDialog({...deleteDialog, open: false})} variant="outlined" sx={{ borderRadius: 2 }}>Batal</Button><Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Ya, Hapus</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({...snackbar, open: false})} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})} sx={{ width: '100%', borderRadius: 3, boxShadow: 4 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Paper>
  );
}