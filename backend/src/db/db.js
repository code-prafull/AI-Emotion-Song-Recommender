const mongoose = require('mongoose');

function connectDb() {
    const url = process.env.MONGODB_URL;

    if (!url) {
        console.error("MONGODB_URL is not set. Add it to the environment variables (e.g. .env locally, hosting dashboard in production).");
        return;
    }

    mongoose.connect(url, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log("DB CONNECTED");
    })
    .catch((e) => {
        console.log("DB CONNECTION FAILED");
        console.log(e);
    });
}

module.exports = connectDb;
