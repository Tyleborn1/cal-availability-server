const http = require('http');
const https = require('https');

const CAL_API_KEY = 'cal_live_159f571f594679e4faaf837f2fdce20e';
const EVENT_TYPE_ID = '5612039';

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(200);
    res.end('OK');
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body);
      const toolCallId = payload.message.toolCalls[0].id;
      const date = payload.message.toolCalls[0].function.arguments.date;

      const startTime = `${date}T00:00:00+02:00`;
      const endTime = `${date}T23:59:59+02:00`;

      const url = `https://api.cal.com/v2/slots/available?eventTypeId=${EVENT_TYPE_ID}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&timeZone=Europe%2FStockholm`;

      const calRes = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${CAL_API_KEY}`,
          'cal-api-version': '2024-08-13'
        }
      });

      const data = await calRes.json();
      const slots = data.data.slots;
      const keys = Object.keys(slots);

      let resultText = 'Inga lediga tider det datumet, försök med ett annat datum.';
      if (keys.length > 0) {
        const times = slots[keys[0]].map(s => {
          const time = new Date(s.time);
          return time.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm' });
        });
        resultText = `Lediga tider den ${date}: ${times.join(', ')}`;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        results: [{ toolCallId, result: resultText }]
      }));

    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results: [{ toolCallId: '', result: 'Något gick fel, försök igen.' }] }));
    }
  });
});

server.listen(3000, () => console.log('Server running on port 3000'));