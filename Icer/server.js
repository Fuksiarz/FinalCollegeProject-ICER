const express = require('express');
const path = require('path');
const app = express();

// Serwowanie statycznych plików z katalogu 'build'
app.use(express.static(path.join(__dirname, 'build')));

// Obsługa wszystkich ścieżek przez index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
