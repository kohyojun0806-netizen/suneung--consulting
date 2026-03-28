const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PREVIEW_PORT || 3001);
const buildDir = path.join(process.cwd(), 'build');

app.use(express.static(buildDir));
app.use((_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Preview server ready: http://localhost:${PORT}`);
});
