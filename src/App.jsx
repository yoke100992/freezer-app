import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, BottomNavigation, BottomNavigationAction, Container, Paper } from '@mui/material';
import { EditNote as InputIcon, TableView as ViewIcon, Settings as SettingsIcon } from '@mui/icons-material';
import InputData from './components/InputData';
import ViewData from './components/ViewData';
import Settings from './components/Settings';

export default function App() {
  const [tab, setTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <>
      {/* App Bar Modern */}
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ backgroundColor: 'rgba(241, 245, 249, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}>
            ❄️ MD Freezer
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pb: 10, pt: 2 }}>
        {tab === 0 && <InputData key={refreshKey} onRefresh={handleRefresh} />}
        {tab === 1 && <ViewData key={refreshKey} />}
        {tab === 2 && <Settings />}
      </Container>

      {/* Floating Bottom Navigation (iOS Style) */}
      <Box sx={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '92%', maxWidth: 420 }}>
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}>
          <BottomNavigation 
            value={tab} 
            onChange={(event, newValue) => setTab(newValue)} 
            showLabels
            sx={{ height: 64, '& .MuiBottomNavigationAction-root': { py: 1 } }}
          >
            <BottomNavigationAction label="Input" icon={<InputIcon />} />
            <BottomNavigationAction label="Data" icon={<ViewIcon />} />
            <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </>
  );
}