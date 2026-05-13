const ImageKit = require("imagekit");
const mongoose = require("mongoose");

const imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadFile(file){

    const response = await imagekit.upload({
        file: file.buffer,
        fileName: new mongoose.Types.ObjectId().toString(),
        folder:"cohort-audio"
    });

    return response;
}

module.exports = {
    uploadFile
}; 
  