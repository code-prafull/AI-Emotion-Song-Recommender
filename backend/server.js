require('dotenv').config();

const app = require('./src/app');
const connectDb = require('./src/db/db'); // no .js needed here

connectDb();

app.listen(3000, () => {
    console.log("Server is ready");
});