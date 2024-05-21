document.getElementById('continueButton').addEventListener('click', function() {
    document.getElementById('intro').style.display = 'none';
    document.getElementById('videoContainer').style.display = 'flex';
    document.getElementById('startButton').style.display = 'block';
    startCamera();  // Start the camera here
  });
  
  window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('continueButton').style.opacity = 1;
    }, 5000);
  });
  
  
  
  document.getElementById('startButton').addEventListener('click', function() {
    startCountdown(3);
  });
  
  function startCountdown(seconds) {
    var display = document.getElementById('countdownDisplay');
    var counter = seconds;
    display.textContent = counter;
    display.style.display = 'block';
  
    var interval = setInterval(function() {
        display.textContent = counter;
        if (counter > 0) {
            counter--;
        } else {
            clearInterval(interval);
            display.style.display = 'none';
            capture();
        }
    }, 1000);
  }
  
  function capture() {
    var video = document.querySelector("#video");
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var flash = document.getElementById('flash');
  
    // Set canvas size equal to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    // Show a flash effect
    flash.style.display = 'block';
    flash.style.opacity = 1;
  
    // Draw the video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    // Add a short delay to ensure the frame is drawn
    setTimeout(() => {
        var dataUrl = canvas.toDataURL('image/jpeg');
        window.capturedImageUrl = dataUrl; // Store the captured image URL globally
  
        // Set this URL to the videoReplacementImage and capturedImage
        document.getElementById("videoReplacementImage").src = dataUrl;
        document.getElementById("capturedImage").src = dataUrl;
        document.getElementById("videoReplacementImage").style.display = 'block';
        video.style.display = 'none';
  
        flash.style.opacity = 0;
        setTimeout(() => flash.style.display = 'none', 500);
  
        // Stop the camera here
        stopCamera();
  
        // Show the action buttons
        document.getElementById('startButton').style.display = 'none';
        document.getElementById('actionButtons').style.display = 'flex';
    }, 100); // Delay may need to be adjusted based on performance
  }
  
  
  
  document.getElementById('sendToServerButton').addEventListener('click', function() {
    var base64Image = window.capturedImageUrl.split(',')[1];
    sendToServer(base64Image, artist);
    showGeneratingPage();
    document.getElementById('actionButtons').style.display = 'none';
  });
  
  document.getElementById('retakeButton').addEventListener('click', function() {
    document.getElementById('video').style.display = 'block';
    document.getElementById('videoReplacementImage').style.display = 'none';
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('startButton').style.display = 'block';
    document.getElementById("imageDisplay").style.display = 'none';
    startCamera();  // Start the camera here
  });

artist = ''  

  document.getElementById('dropdown').addEventListener('change', function () {
    artist = document.getElementById('dropdown').value;
    document.getElementById('name').innerHTML = artist;
    console.log(`${artist}`)
  })
  


  function sendToServer(base64Image, artist) {
    console.log('Sending base64 image to server:', base64Image);
    fetch('/describe-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({image: base64Image})
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("description").textContent = data.description || 'No description available.';
        document.getElementById("description").style.display = 'block';
        console.log("This is what you're looking for", artist);

        generateImage(data.description, artist);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById("description").textContent = 'An error occurred while generating the image description.';
        document.getElementById("description").style.display = 'block';
    });
  }
  
  function showGeneratingPage() {
    var videoContainer = document.getElementById('videoContainer');
    if (videoContainer) {
      videoContainer.parentNode.removeChild(videoContainer); // Remove the video container from the DOM
    }
  
    var generatingDiv = document.createElement('div');
    generatingDiv.className = 'generating-text';
    generatingDiv.innerHTML = 'Generating<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    document.body.appendChild(generatingDiv);
  
    // Hide the canvas explicitly if it's still visible
    document.getElementById('canvas').style.display = 'none';
  
    // Hide action buttons during generation
    document.getElementById('actionButtons').style.display = 'none';
  
    // Hide image displays during generation
    document.getElementById("videoReplacementImage").style.display = 'none';
    document.getElementById("capturedImage").style.display = 'none';
    document.getElementById("generatedImage").style.display = 'none';
    document.getElementById("imageDisplay").style.display = 'none';
  }
  
  
  
  
  function generateImage(description, artist) {
    fetch('/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: description, artist: artist})
    })
    .then(response => response.json())
    .then(data => {
        if (data.imageUrl) {
            var imgElement = document.getElementById("generatedImage");
            var capImgElement = document.getElementById("capturedImage");
  
            imgElement.src = data.imageUrl;
            capImgElement.src = window.capturedImageUrl;  // Ensure the captured image is ready
  
            // Remove the generating text
            var generatingText = document.querySelector('.generating-text');
            if (generatingText) {
                document.body.removeChild(generatingText);
            }
  
            // Now display the images
            document.getElementById("imageDisplay").style.display = 'flex';
            imgElement.style.display = 'block';
            capImgElement.style.display = 'block';
            showRestartButton();
        } else {
            throw new Error('No image URL received.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
  }
  
  
  document.getElementById('restartButton').addEventListener('click', function() {
    location.reload(); // This will refresh the page
  });
  
  function showRestartButton() {
    document.getElementById('restartButton').style.display = 'block'; // Show the restart button
  }
  
  function hideRestartButton() {
    document.getElementById('restartButton').style.display = 'none'; // Hide the restart button
  }
  
  
  function stopCamera() {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
  }
  
  
  function startCamera() {
    var video = document.querySelector("#video");
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
                window.stream = stream; // Store the stream globally
            })
            .catch(function (error) {
                console.log("Something went wrong with the camera!", error);
            });
    }
  }