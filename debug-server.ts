import 'dotenv/config';
import express from 'express';

// Simple test server to check if Express works
const app = express();

app.get('/', (req, res) => {
  res.send('Express server is working!');
});

app.get('/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set',
    twilioSid: process.env.TWILIO_ACCOUNT_SID ? 'Set (hidden for security)' : 'Not set',
  });
});

const port = 5001;
app.listen(port, () => {
  console.log(`Debug server running at http://localhost:${port}`);
  console.log(`Check http://localhost:${port}/env for environment variables`);
});
