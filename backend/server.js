require('dotenv').config();

const app = require('./src/app');
const connectDb = require('./src/db/db');

connectDb();

// Hosting platforms (Render, Railway, Heroku...) assign their own port.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is ready on port ${PORT}`);
});
