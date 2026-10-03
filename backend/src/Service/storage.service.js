const ImageKit = require("imagekit");
const mongoose = require("mongoose");

// Client is created lazily so the server can start (and serve GET /song)
// even when ImageKit keys are not configured yet. A missing key then only
// affects uploads, with a clear error message.
let imagekit = null;

function getClient() {
    if (imagekit) return imagekit;

    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
        throw new Error(
            "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in the environment."
        );
    }

    imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint
    });

    return imagekit;
}

async function uploadFile(file){

    const response = await getClient().upload({
        file: file.buffer,
        fileName: new mongoose.Types.ObjectId().toString(),
        folder:"cohort-audio"
    });

    return response;
}

module.exports = {
    uploadFile
};
