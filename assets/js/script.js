console.clear();

// Global variables
var initialTime,
    idInterval,
    mediaRecorder,
    audioURLTest = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/858/outfoxing.mp3";

const init = () => {
  const supportedgUM = () => !!(navigator.mediaDevices.getUserMedia)

  // If getUserMedia does not support, alerts the user
  if (typeof MediaRecorder === "undefined" || !supportedgUM())
    return alert("GetUserMedia not supported on your browser! Update or change your browser.");

  // DOM elements
  const recorder = document.getElementById('recorder'),
        player = document.getElementById('player'),
        devicesList = document.getElementById('devicesList'),
        volumeRange = document.getElementById('volume'),
        btnMuteRecording = document.getElementById('btnMute'),
        duration = document.getElementById('duration'),
        btnStartRecording = document.getElementById('btnRecord'),
        btnStopRecording = document.getElementById('btnStopRecording');

  // Check the list of audio input devices and fill in the select
  const fillList = () => {
    navigator
        .mediaDevices
        .enumerateDevices()
        .then(devices => {
            devicesList.innerHTML = "";
            devices.forEach((device, index) => {
                if (device.kind === "audioinput") {
                    const option = document.createElement("option");
                    // Firefox no trae nada con label, gestionarlo
                    option.text = device.label || `Device ${index + 1}`;
                    option.value = device.deviceId;
                    devicesList.appendChild(option);
                }
            });
        })
  };

  // Helper for duration; informative
  const startCounter = () => {
    initialTime = Date.now();
    idInterval = setInterval(updateCounter, 500);
  };

  //Update counter
  const updateCounter = () => {
    duration.textContent = showCounter((Date.now() - initialTime) / 1000);
  }

  //Update counter
  const showCounter = (seconds) => {
    let hours = Math.floor(seconds / 60 / 60);
    seconds -= hours * 60 * 60;
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    seconds = parseInt(seconds);
    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;

    return `${hours}:${minutes}:${seconds}`;
  };

  const stopCounter = () => {
    clearInterval(idInterval);
    initialTime = null;
    duration.textContent = "00:00:00";
  }

  // Start recording audio with the selected device
  const recording = () => {
      if (!devicesList.options.length) return alert("No devices, choose a device. ");

      navigator.mediaDevices.getUserMedia({
        audio: { deviceId: devicesList.value }
      })
      .then(
        handleSuccess
      )
      .catch(error => {
        // Handle error, maybe they didn't give permission
        console.log('The following gUM error occurred: ' + error)
      });
  };

  // Record using WebAudio
  const handleSuccess = (stream) => {
    // Create a MediaStreamAudioSourceNode
    // Feed the HTMLMediaElement into it
    let audioCtx = new AudioContext();
    let gainNode = new GainNode(audioCtx);
    let microphone = audioCtx.createMediaStreamSource(stream);

    // Change volume
    volumeRange.addEventListener('input', function() {
      gainNode.gain.value = this.value;
    }, false);

    // Change mute / unmute
    btnMuteRecording.addEventListener("click", () => {
      if (btnMuteRecording.dataset.mute === 'on') {
        //no volume
        gainNode.gain.value = 0;
        btnMuteRecording.dataset.mute = 'off';
      } else if (btnMuteRecording.dataset.mute === 'off') {
        //normal volume
        gainNode.gain.value = 1;
        btnMuteRecording.dataset.mute = 'on';
      }
    }, false);

    // connect our graph
    microphone.connect(gainNode);

    // save stream on audio URL
    let recordedChunks = [];
    // Start recording with the stream
    mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/webm'});
    
    // Listen when data is available and put the data brought by the dataavailable event
    mediaRecorder.ondataavailable = (e) => {
      // Add chunks
      if(e.data.size > 0) recordedChunks.push(e.data);
    };

    // When stopping recording
    mediaRecorder.onstop = () => {
      // Stop stream
      stream.getTracks().forEach(track => track.stop());
      
      // Convert the chunks to a binary object
      let blobAudio = new Blob(recordedChunks);
      
      // Create a URL or link to download
      audioURLTest = URL.createObjectURL(blobAudio);
      
      // Put track on audio player
      player.src = audioURLTest;
      
      // Delete mediaRecorder object
      mediaRecorder = null;
    };

    mediaRecorder.start();
    // Start counter
    startCounter();
  }

  // Stop Recording
  const stopRecording = () => {
    mediaRecorder.stop();
    // Stop counter
    stopCounter();
  };

  // DOM events
  btnStartRecording.addEventListener("click", recording);
  btnStopRecording.addEventListener("click", stopRecording);

  // Fill device list
  fillList();




  /* ----------- SPEAKERS ---------------*/
  // for cross browser
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  // load some sound
  const audioElement = document.getElementById('player');
  audioElement.src = audioURLTest;
  const track = audioCtx.createMediaElementSource(audioElement);

  const playButton = document.querySelector('.tape-controls-play');
  const soundButton = document.querySelector('.tape-controls-sound');
  const stopButton = document.querySelector('.tape-controls-stop');

  // play pause audio
  playButton.addEventListener('click', function() {
    // check if context is in suspended state (autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // check if track stopped
    if(audioElement.src === '') audioElement.src = audioURLTest;

    if (this.dataset.playing === 'false') { 
      audioElement.play();
      this.dataset.playing = 'true';
    // if track is playing pause it
    } else if (this.dataset.playing === 'true') {
      audioElement.pause();
      this.dataset.playing = 'false';
    }
    
    let state = this.getAttribute('aria-checked') === "true" ? true : false;
    this.setAttribute( 'aria-checked', state ? "false" : "true" );
  }, false);

  // stop audio
  stopButton.addEventListener('click', function() {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.removeAttribute('src');
    playButton.dataset.playing = 'false';
  }, false);

  // if track ends
  audioElement.addEventListener('ended', () => {
    playButton.dataset.playing = 'false';
    playButton.setAttribute( "aria-checked", "false" );
  }, false);

  // filter
  const biquadFilter = audioCtx.createBiquadFilter();
  biquadFilter.type = 'notch';
  const filterControl = document.getElementById('filter');
  
  filterControl.addEventListener('input', function() {
    biquadFilter.type = this.value;
  }, false);

  // volume
  const gainNode = audioCtx.createGain();
  const volumeControl = document.getElementById('volumeSpe');

  volumeControl.addEventListener('input', function() {
    gainNode.gain.value = this.value;
  }, false);

  // mute control
  soundButton.addEventListener('click', function() {
    if(this.dataset.sound === 'true') {
      gainNode.gain.value = 0;
      this.dataset.sound = "false";
    } else if (this.dataset.sound === 'false') {
      gainNode.gain.value = 1;
      this.dataset.sound = "true";
    }
  }, false);

  // panning
  const pannerOptions = {pan: 0};
  const panner = new StereoPannerNode(audioCtx, pannerOptions);
  const pannerControl = document.getElementById('panner');

  pannerControl.addEventListener('input', function() {
    panner.pan.value = this.value;	
  }, false);

  // connect our graph
  track.connect(biquadFilter).connect(gainNode).connect(panner).connect(audioCtx.destination);

  // power button
  const powerButton = document.getElementById('btnPower');

  powerButton.addEventListener('click', function() {
    if (this.dataset.power === 'on') {
      audioCtx.suspend();
      this.dataset.power = 'off';
    } else if (this.dataset.power === 'off') {
      audioCtx.resume();
      this.dataset.power = 'on';
    }
    //console.log(audioCtx.state);
  }, false);
}

// Wait for the document to be ready...
document.addEventListener("DOMContentLoaded", init);