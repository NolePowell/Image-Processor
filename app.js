/*
 * Author: Nole Powell 
 * Date: 3/3/24
 * Version: 2.0
 * Description: This application is designed to be an RPC API that will process user images
 */
const express = require('express');
const sharp = require('sharp');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require("fs");

const LOCAL_HOST = 3000;

const app = express();
app.use(bodyParser.json());
app.use('/', express.static(path.join(__dirname + '/public'), { index: 'form.html' }));

app.post('/processImage', async (req, res) => {
    try {
        const { commands, imageData } = req.body;

        // Convert the Base64 image data to a buffer
        const imageBuffer = Buffer.from(imageData, 'base64');

        // Initialize sharp pipeline with image buffer
        let sharpPipeline = sharp(imageBuffer);

        // Initialize an array to store thumbnails when created
        const thumbnailPaths = [];

        // Execute specified operations
        for (const command of commands) {
            const [operation, params] = command.split(' ');

            switch (operation) {
                case 'resizeWidth':
                    const width = parseInt(params);
                    sharpPipeline = sharpPipeline.resize({ width });
                    break;
                case 'resizeHeight':
                    const height = parseInt(params);
                    sharpPipeline = sharpPipeline.resize({ height });
                    break;
                case 'rotateLeft':
                    const leftDegrees = (parseInt(params) * -1);
                    sharpPipeline = sharpPipeline.rotate(leftDegrees);
                    break;
                case 'rotateRight':
                    const rightDegrees = parseInt(params);
                    sharpPipeline = sharpPipeline.rotate(rightDegrees);
                    break;
                case 'rotateDegrees':
                    const degrees = parseInt(params);
                    sharpPipeline = sharpPipeline.rotate(degrees);
                    break;
                case 'grayscale':
                    sharpPipeline = sharpPipeline.grayscale();
                    break;
                case 'flipHorizontal':
                    sharpPipeline = sharpPipeline.flop();
                    break;
                case 'flipVertical':
                    sharpPipeline = sharpPipeline.flip();
                    break;
                case 'generateThumbnail':
                    // Create a separate thumbnail from the processed image
                    const thumbnailPath = `images/thumbnail_${Date.now()}.jpg`; //Use date now to ensure unique value
                    await sharpPipeline.resize(200, 200, { fit: sharp.fit.cover }).toFile(thumbnailPath);
                    thumbnailPaths.push(thumbnailPath);
                    break;
                default:
                    // Error message for if new operations are added and not functioning correctly
                    console.log(`Invalid operation: ${operation}`);
                    break;
            }
        }

        // Apply all operations to the image buffer
        await sharpPipeline.toFile("images/processed_image.jpg");

        console.log("Image processing completed successfully.")

        // Send response with generated thumbnail paths
        res.status(200).json({ message: "Image processing completed successfully.", thumbnailPaths });
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ error: error.message });
    }
});

// Set up the express server
const PORT = process.env.PORT || LOCAL_HOST;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
