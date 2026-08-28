import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563EB', // Modern Royal Blue
      light: '#60A5FA',
      dark: '#1E40AF',
    },
    secondary: {
      main: '#10B981', // Emerald Green untuk sukses
    },
    background: {
      default: '#F1F5F9', // Soft slate background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' },
  },
  shape: {
    borderRadius: 16, // Sudut lebih membulat dan modern
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' },
          '&:active': { transform: 'translateY(0)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0,0,0,0.03)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#94A3B8' },
            '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 2 },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { transition: 'all 0.2s ease', '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' } }
      }
    }
  },
});

export default theme;