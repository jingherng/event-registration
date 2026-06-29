import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Box, Typography, FormHelperText,
} from '@mui/material';
import { createEvent, fetchEmployees, Employee } from '../../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL_FORM = {
  name: '',
  dateTime: '',
  postalCode: '',
  deadline: '',
  capacity: '',
  handlerUuid: '',
};

type FieldErrors = Partial<Record<keyof typeof INITIAL_FORM, string>>;

function getNowMin() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
}

export default function AddEventForm({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const nowMin = getNowMin();

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
      setFieldErrors({});
      fetchEmployees()
        .then(setEmployees)
        .catch(() => setFieldErrors({ name: 'Failed to load employees. Please try again.' }));
    }
  }, [open]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const { name, dateTime, postalCode, deadline, capacity, handlerUuid } = form;

    // Required field checks
    const required: FieldErrors = {};
    if (!name) required.name = 'Event name is required';
    if (!dateTime) required.dateTime = 'Date & time is required';
    if (!postalCode) required.postalCode = 'Postal code is required';
    if (!deadline) required.deadline = 'Registration deadline is required';
    if (!capacity) required.capacity = 'Capacity is required';
    if (!handlerUuid) required.handlerUuid = 'Handler is required';
    if (Object.keys(required).length > 0) {
      setFieldErrors(required);
      return;
    }

    // Business rule checks
    const ruleErrors: FieldErrors = {};
    if (new Date(dateTime) <= new Date()) {
      ruleErrors.dateTime = 'Must be in the future and after the registration deadline';
    }
    if (new Date(deadline) >= new Date(dateTime)) {
      ruleErrors.deadline = 'Must be before the event date & time';
    }
    if (Object.keys(ruleErrors).length > 0) {
      setFieldErrors(ruleErrors);
      return;
    }

    setLoading(true);
    try {
      await createEvent({
        name,
        dateTime: new Date(dateTime).toISOString(),
        postalCode,
        deadline: new Date(deadline).toISOString(),
        capacity: parseInt(capacity, 10),
        handlerUuid,
      });
      onSuccess();
    } catch (err: any) {
      const msg: string = err?.response?.data?.error || 'Failed to create event. Please try again.';
      // Route server error to the most relevant field
      if (msg.toLowerCase().includes('name')) {
        setFieldErrors({ name: msg });
      } else if (msg.toLowerCase().includes('postal') || msg.toLowerCase().includes('address')) {
        setFieldErrors({ postalCode: msg });
      } else if (msg.toLowerCase().includes('handler')) {
        setFieldErrors({ handlerUuid: msg });
      } else if (msg.toLowerCase().includes('deadline')) {
        setFieldErrors({ deadline: msg });
      } else if (msg.toLowerCase().includes('date') || msg.toLowerCase().includes('time')) {
        setFieldErrors({ dateTime: msg });
      } else {
        setFieldErrors({ name: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Event</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Event Name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
            fullWidth
          />
          <TextField
            label="Date & Time"
            type="datetime-local"
            value={form.dateTime}
            onChange={(e) => handleChange('dateTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: form.deadline > nowMin ? form.deadline : nowMin }}
            error={!!fieldErrors.dateTime}
            helperText={fieldErrors.dateTime}
            fullWidth
          />
          <TextField
            label="Postal Code"
            value={form.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="6-digit Singapore postal code"
            inputProps={{ maxLength: 6 }}
            error={!!fieldErrors.postalCode}
            helperText={fieldErrors.postalCode}
            fullWidth
          />
          <TextField
            label="Registration Deadline"
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => handleChange('deadline', e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: nowMin, max: form.dateTime || undefined }}
            error={!!fieldErrors.deadline}
            helperText={fieldErrors.deadline}
            fullWidth
          />
          <TextField
            label="Capacity"
            type="number"
            value={form.capacity}
            onChange={(e) => handleChange('capacity', e.target.value)}
            inputProps={{ min: 1 }}
            error={!!fieldErrors.capacity}
            helperText={fieldErrors.capacity}
            fullWidth
          />
          <FormControl fullWidth error={!!fieldErrors.handlerUuid}>
            <InputLabel>Handler</InputLabel>
            <Select
              value={form.handlerUuid}
              label="Handler"
              onChange={(e) => handleChange('handlerUuid', e.target.value)}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.uuid} value={emp.uuid}>
                  {emp.name}
                </MenuItem>
              ))}
            </Select>
            {fieldErrors.handlerUuid && (
              <FormHelperText>{fieldErrors.handlerUuid}</FormHelperText>
            )}
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            Address will be automatically resolved from the postal code via OneMap.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Create Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
