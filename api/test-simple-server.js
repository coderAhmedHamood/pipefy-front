const express = require('express');
const app = express();
const PORT = 3003;

app.get('/', (req, res) => {
  res.json({ message: 'Simple server works!' });
});

app.listen(PORT, () => {
  console.log(`✅ Simple server running on http://localhost:${PORT}`);
});
