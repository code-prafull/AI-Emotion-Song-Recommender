const mongoose = require('mongoose');

function connectDb() {
    mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log("DB CONNECTED");
    })
    .catch((e) => {
        console.log("DB CONNECTION FAILED");
        console.log(e);
    });
}

module.exports = connectDb;