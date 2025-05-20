import express from 'express';

const app = express();
const PORT = 3000;

// For webhook testing
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello, ABC Mortgage!');
});

// Example webhook endpoint
app.post('/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).send('Webhook received!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
