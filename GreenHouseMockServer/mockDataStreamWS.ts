import WebSocket, { WebSocketServer } from "ws";

const PORT = 4000;
const wss = new WebSocketServer({ port: PORT });

function getRandomValue(base: number, variation: number): number {
  return parseFloat((base + (Math.random() - 0.5) * variation).toFixed(2));
}

function getRandomEvent(): string {
  if (Math.random() < 0.8) return "";

  const events = ["CO2 warning", "temperature HIGH"];
  return events[Math.floor(Math.random() * events.length)] ?? "";
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  let snapShotDataArray = [];
  for (let index = 0; index < 20; index++) {
    const newsMessage = {
      temperature: getRandomValue(25, 5),
      humidity: getRandomValue(50, 2),
      co2: getRandomValue(800, 20),
      event: getRandomEvent(),
      timestamp: Date.now() - (20 - index) * 100,
      // seq: Date.now(), //(Date.now() / 1000).toFixed(0),
    };
    snapShotDataArray.push(newsMessage);
  }

  const snapshotMessage = {
    type: "snapshot",
    data: snapShotDataArray,
  };
  ws.send(JSON.stringify(snapshotMessage));
  console.log("snapshot sent:", snapshotMessage);

  const interval = setInterval(() => {
    const data = {
      temperature: getRandomValue(25, 5),
      humidity: getRandomValue(50, 2),
      co2: getRandomValue(800, 20),
      event: getRandomEvent(),
      timestamp: Date.now(),
      // seq: Date.now(), //(Date.now() / 1000).toFixed(0),
    };

    const deltaDataMessage = {
      type: "delta",
      data: [data],
    };
    ws.send(JSON.stringify(deltaDataMessage));
    console.log("data sent:", deltaDataMessage);
  }, 100);

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

console.log(
  `✅ WebSocket server started and is running on ws://localhost:${PORT}`
);
