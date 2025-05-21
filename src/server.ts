// src/server.ts
import express from 'express';
import bodyParser from 'body-parser';
import { getFirstFreeSlots, bookSlot } from './calendar';

const app = express();
app.use(bodyParser.json());

// 1) Fetch availability (called by your Retell “Fetch Available Slots” node)
app.post('/availability', async (req, res) => {
  console.log('[Server] Received POST /availability, body =', req.body);
  try {
    const slots = await getFirstFreeSlots(30, 3);
    res.json({
      availability_for_selected_time: [
        {
          date: new Date().toLocaleString('en-US', {
            timeZone: 'UTC',
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }),
          availability_range: slots.map(s =>
            `From ${new Date(s.start).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })} to ${new Date(s.end).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}`
          )
        }
      ]
    });
  } catch (err: any) {
    console.error('[Server] /availability error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2) Book a slot (called by your Retell “Book Callback” node)
app.post('/book', async (req, res) => {
  const { slot, lead } = req.body;
  try {
    await bookSlot(slot, lead);
    res.json({ success: true });
  } catch (e:any) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
});


const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Calendar service running on ${port}`));
