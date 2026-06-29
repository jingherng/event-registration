import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, CircularProgress, Alert, Typography,
} from '@mui/material';
import { fetchEventTrend, TrendEntry, AdminEvent } from '../../api/client';

interface Props {
  event: AdminEvent;
  onClose: () => void;
}

export default function TrendModal({ event, onClose }: Props) {
  const [trend, setTrend] = useState<TrendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEventTrend(event.uuid);
        setTrend(data);
      } catch {
        setError('Failed to load trend data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [event.uuid]);

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Registration Trend — {event.name}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <CircularProgress />
        ) : trend.length === 0 ? (
          <Typography color="text.secondary">No trend data available.</Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">New Registrations</TableCell>
                  <TableCell align="right">Total Registrations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trend.map((entry) => (
                  <TableRow key={entry.date} hover>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell align="right">{entry.newRegistrationCount}</TableCell>
                    <TableCell align="right">{entry.registrationCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
