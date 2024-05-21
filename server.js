// Import necessary modules
const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");

// Load environment variables
dotenv.config();

// Create an Express application
const app = express();

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Parse JSON bodies with a limit of 50MB for incoming requests
app.use(express.json({ limit: "50mb" }));

// Retrieve OpenAI API key from environment variables
const openaiApiKey = process.env.OPENAI_API_KEY;

// Set up headers for API calls to OpenAI
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openaiApiKey}`
};


// Define the POST endpoint '/describe-image'
app.post('/describe-image', async (req, res, next) => {
  const base64Image = req.body.image; // Get the base64 image data from the request body
  try {
      const payload = {
          model: "gpt-4-turbo", // Specify the model to be used
          messages: [
              {
                  role: "user",
                  content: [
                      {
                          type: "text",
                          text: "If the image contains a person, provide an accurate description of the person shown in the image, detailing their facial features, skin tone, exact hair length and style (like if the hair covers the forehead or reaches the ears), eye color, facial structure, and visible clothing. This precise description is needed for replicating the image. If the image does not contain a person, decribe as much of the image as possible while being precise, examine lighting, features, location, etc."
                      },
                      {
                          type: "image_url",
                          image_url: {
                              url: `data:image/jpeg;base64,${base64Image}` // Convert base64 string to an image URL
                          }
                      }
                  ]
              }
          ]
      };

      // Make an API request to OpenAI
      const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers });
      const choice = response.data.choices[0]; // Extract the first choice from the response
      if (choice && choice.message && choice.message.content) {
          const description = choice.message.content; // Extract the description
          res.send({ description }); // Send the description back to the client
      } else {
          res.status(404).send({ error: "No description found in API response" });
      }
    } catch (error) {
      next(error); // Pass errors to the error handler
  }
});



// Define the POST endpoint '/generate-image'
app.post('/generate-image', async (req, res, next) => {
  console.log(req.body.description);
  console.log(req.body.artist);
  const description = req.body.description; // Get the description from the request body
  const artist = req.body.artist;
  // console.log(artist)
  try {
    const dallePayload = {
      model: "dall-e-3", // Specify the model to be used
      prompt: `Create an image in the style of a famous ${artist} painting that matches this description: ${description}. It is very important that the image looks like a painting, spend time creating brush stroke effects to make the image look like a painting.`, // Use the description as the prompt for the image generation
      n: 1, // Generate one image
      size: "1792x1024" // Specify the image size
    };

    // Make an API request to DALL-E 3
    const dalleResponse = await axios.post('https://api.openai.com/v1/images/generations', dallePayload, { headers });

    const generatedImages = dalleResponse.data.data;
    if (generatedImages.length > 0) {
      const imageUrl = generatedImages[0].url; // Assume the first image is the desired one
      res.send({ imageUrl }); // Send the image URL back to the client
    } else {
      res.status(404).send({ error: "No images generated" });
    }
  } catch (error) {
    next(error); // Pass errors to the error handler
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);  // Log error stack for debugging
  const statusCode = err.response ? err.response.status : 500;
  res.status(statusCode).send({
      error: {
          message: err.message,
          status: statusCode,
          details: err.response ? JSON.stringify(err.response.data, null, 2) : 'A server error occurred'
      }
  });
});



app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Health Check</title>
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon_package_v0.16/favicon-32x32.png">
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon_package_v0.16/favicon-16x16.png">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
      </head>
      <body>
          <h1>Health Check Passed</h1>
          <p>The service is up and running.</p>
      </body>
      </html>
  `);
});


// Catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).sendFile('404.html', { root: __dirname + '/public' });
});


// Start the server on the specified port, defaulting to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});