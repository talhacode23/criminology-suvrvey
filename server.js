import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyDashboardPasscode } from './lib/dashboardAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DASHBOARD_PASSCODE = process.env.DASHBOARD_PASSCODE || 'lahore2026';

app.use(express.json());

app.post('/api/verify-dashboard-password', (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (verifyDashboardPasscode(password, DASHBOARD_PASSCODE)) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Incorrect passcode. Access denied.' });
});

app.use('/lib', express.static(path.join(__dirname, 'lib')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
