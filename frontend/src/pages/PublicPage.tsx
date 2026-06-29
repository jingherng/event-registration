import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, MenuItem, Select, FormControl,
  InputLabel, Paper, TextField, Button, Alert, CircularProgress,
  Divider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { fetchPublicEvents, registerForEvent, PublicEvent } from '../api/client';

type Step = 'select' | 'register' | 'thankyou';

export default function PublicPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [selectedUuid, setSelectedUuid] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('select');
  const [registrationNo, setRegistrationNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPublicEvents();
        setEvents(data);
      } catch {
        setError('Failed to load events.');
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, []);

  const handleEventSelect = (uuid: string) => {
    setSelectedUuid(uuid);
    setSelectedEvent(events.find((e) => e.uuid === uuid) || null);
    setError('');
  };

  const handleRegister = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await registerForEvent({ eventUuid: selectedUuid, emailAddress: email });
      setRegistrationNo(result.registrationNo);
      setStep('thankyou');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedUuid('');
    setSelectedEvent(null);
    setEmail('');
    setRegistrationNo('');
    setError('');
  };

  if (step === 'thankyou') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 72, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Thank You!
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Your registration has been confirmed.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Registration Number
          </Typography>
          <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', letterSpacing: 4 }}>
            {registrationNo}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please keep this number for your records.
          </Typography>
          <Button variant="outlined" sx={{ mt: 4 }} onClick={handleReset}>
            Register for another event
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Event Registration
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Select an open event and register with your email address.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mt: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Select an Event</InputLabel>
          {loadingEvents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Select
              value={selectedUuid}
              label="Select an Event"
              onChange={(e) => handleEventSelect(e.target.value)}
            >
              {events.length === 0 ? (
                <MenuItem disabled>No open events available</MenuItem>
              ) : (
                events.map((event) => (
                  <MenuItem key={event.uuid} value={event.uuid}>
                    {event.name}
                  </MenuItem>
                ))
              )}
            </Select>
          )}
        </FormControl>

        {selectedEvent && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Event Details
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Name:</Typography>
              <Typography variant="body2">{selectedEvent.name}</Typography>
              <Typography variant="body2" color="text.secondary">Date / Time:</Typography>
              <Typography variant="body2">{new Date(selectedEvent.dateTime).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Address:</Typography>
              <Typography variant="body2">{selectedEvent.address}</Typography>
              <Typography variant="body2" color="text.secondary">Registration Deadline:</Typography>
              <Typography variant="body2">{new Date(selectedEvent.deadline).toLocaleString()}</Typography>
            </Box>
          </Box>
        )}

        {selectedEvent && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
