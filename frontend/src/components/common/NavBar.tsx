import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar position="static">
      <Toolbar>
        <EventIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Event Registration System
        </Typography>
        <Box>
          <Button
            color="inherit"
            onClick={() => navigate('/')}
            variant={location.pathname === '/' ? 'outlined' : 'text'}
            sx={{ mr: 1 }}
          >
            Public
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/admin')}
            variant={location.pathname === '/admin' ? 'outlined' : 'text'}
            startIcon={<AdminPanelSettingsIcon />}
          >
            Admin
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
