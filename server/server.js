// const server = require('ws').Server;
// const ws = new server({ port: 8081 });

import { WebSocketServer as WSServer } from 'ws';
const wsSender = new WSServer ({
  port: 8081
});
const wsReceiver = new WSServer ({
  port: 8082
});

wsSender.on('connection', (socket) => {
  console.log('[wsSender]connected!');

  socket.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log(`[wsSender]`);
    console.log(message);
    wsReceiver.clients.forEach((socket) => {
      socket.send(JSON.stringify(message));
    });
  });

  socket.on('close', () => {
    console.log('[wsSender] good bye.');
  });
});

wsReceiver.on('connection', (socket) => {
  console.log('[wsReceiver]connected!');

  socket.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log(`[wsReceiver]`);
    console.log(message);
    wsSender.clients.forEach((socket) => {
      socket.send(JSON.stringify(message));
    });
  });

  socket.on('close', () => {
    console.log('[wsSender] good bye.');
  });
});