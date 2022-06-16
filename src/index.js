const express = require('express');
const app = express();

const port = process.env.port || 4001;

app.get('/', (req, res) => res.send('Hello World!!!'));
app.listen(port, () => console.log(`Listeinig port ${port}!`));
