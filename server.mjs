import { createServer } from 'https';
import { readFileSync } from 'fs';
import next from 'next';
import { parse } from 'url';

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: readFileSync('./localhost-key.pem'),
  cert: readFileSync('./localhost.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('> Ready on https://192.168.0.6:3000');
  });
});
