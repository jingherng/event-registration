import { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Button, TextField, FormControlLabel,
  Switch, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Pagination, Chip, CircularProgress, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  fetchAdminEvents,
  AdminEvent,
} from '../api/client';
import AddEventForm from '../components/admin/AddEventForm';
import TrendModal from '../components/admin/TrendModal';

const PAGE_SIZE = 10;

export default function AdminPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [trendEvent, setTrendEvent] = useState<AdminEvent | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: { page: number; search?: string; open?: true } = { page };
      if (search) params.search = search;
      if (openOnly) params.open = true;
      const result = await fetchAdminEvents(params);
      setEvents(result.events);
      setTotal(result.total);
    } catch {
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, openOnly]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const isOpen = (event: AdminEvent) => {
    return new Date(event.deadline) > new Date() && event.registrationCount < event.capacity;
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Event Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Search by name, address or handler"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="small"
          sx={{ minWidth: 320 }}
        />
        <FormControlLabel
          control={<Switch checked={openOnly} onChange={(e) => { setOpenOnly(e.target.checked); setPage(1); }} />}
          label="Open events only"
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
        >
          Add Event
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
              <TableCell>Name</TableCell>
              <TableCell>Date / Time</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell align="center">Capacity</TableCell>
              <TableCell align="center">Registered</TableCell>
              <TableCell>Handler</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  No events found.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.uuid} hover>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>{new Date(event.dateTime).toLocaleString()}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.address}
                  </TableCell>
                  <TableCell>{new Date(event.deadline).toLocaleString()}</TableCell>
                  <TableCell align="center">{event.capacity}</TableCell>
                  <TableCell align="center">{event.registrationCount}</TableCell>
                  <TableCell>{event.handler.name}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={isOpen(event) ? 'Open' : 'Closed'}
                      color={isOpen(event) ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<TrendingUpIcon />}
                      onClick={() => setTrendEvent(event)}
                    >
                      Click Trend
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>

      <AddEventForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { setAddOpen(false); loadEvents(); }}
      />

      {trendEvent && (
        <TrendModal
          event={trendEvent}
          onClose={() => setTrendEvent(null)}
        />
      )}
    </Container>
  );
}
