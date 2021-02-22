//--------------
// Audio Object
//--------------

var audio = {
    buffer: {},
    compatibility: {},
    files: [
      'https://docs.google.com/uc?export=download&id=1J7ChpmgS0pwsOYK_qZbPPeoL55Z2SgbV',
      // 'drip.wav',
      // 'wind.wav',
      // 'bird.wav',
      // 'music.wav'
    ],
    proceed: true,
    gain: {},
    master_gain: {},
    source_loop: {},
    source_once: {}
};

//-----------------
// Audio Functions
//-----------------
audio.findSync = function(n) {
    var first = 0,
        current = 0,
        offset = 0;

    // Find the audio source with the earliest startTime to sync all others to
    for (var i in audio.source_loop) {
        current = audio.source_loop[i]._startTime;
        if (current > 0) {
            if (current < first || first === 0) {
                first = current;
            }
        }
    }

    if (audio.context.currentTime > first) {
        offset = (audio.context.currentTime - first) % audio.buffer[n].duration;
    }

    return offset;
};



audio.setup_gain = function(n) {
//audio.gain[n] = {};
audio.gain[n] = audio.context.createGain();
audio.gain[n].connect(audio.master_gain);

var slider = document.getElementById("slider-" + n);
  slider.addEventListener('change', function() { //change?
                            audio.changeVolume(this.value, n);
                        });

  audio.gain[n].gain.value = parseFloat(slider.value)/100;
  console.log("original value" + audio.gain[n].gain.value);

}


audio.changeVolume = function(element, n) {
var fraction = parseFloat(element) / 100;
  audio.gain[n].gain.value = fraction * fraction;
console.log("changed value" + audio.gain[n].gain.value);
}




audio.master_setup = function() {
  //audio.master_gain = {};
  audio.master_gain = audio.context.createGain();
  audio.master_gain.connect(audio.context.destination);

  var master_slider = document.getElementById("master_slider");
  master_slider.addEventListener('change', function() { //change?
              audio.controlAll(this.value);
            });

  audio.master_gain.gain.value = parseFloat(master_slider.value)/100;
  console.log("master value" + audio.master_gain.gain.value);

    audio.controlAll = function(volume) {
    var fraction = parseFloat(volume)/100;
    console.log(fraction);
    audio.master_gain.gain.value = fraction;
    }

}



audio.play = function(n) {


    if (audio.source_loop[n]._playing) {
        audio.stop(n);

    } else {
        audio.source_loop[n] = audio.context.createBufferSource();
        audio.source_loop[n].buffer = audio.buffer[n];
        audio.source_loop[n].loop = true;

  audio.source_loop[n].connect(audio.gain[n]);


        var offset = audio.findSync(n);
        audio.source_loop[n]._startTime = audio.context.currentTime;

        if (audio.compatibility.start === 'noteOn') {
            /*
            The depreciated noteOn() function does not support offsets.
            Compensate by using noteGrainOn() with an offset to play once and then schedule a noteOn() call to loop after that.
            */
            audio.source_once[n] = audio.context.createBufferSource();
            audio.source_once[n].buffer = audio.buffer[n];
            audio.source_once[n].noteGrainOn(0, offset, audio.buffer[n].duration - offset); // currentTime, offset, duration

    audio.source_once[n].connect(audio.gain[n]);

            /*
            Note about the third parameter of noteGrainOn().
            If your sound is 10 seconds long, your offset 5 and duration 5 then you'll get what you expect.
            If your sound is 10 seconds long, your offset 5 and duration 10 then the sound will play from the start instead of the offset.
            */

            // Now queue up our looping sound to start immediatly after the source_once audio plays.
            audio.source_loop[n][audio.compatibility.start](audio.context.currentTime + (audio.buffer[n].duration - offset));
        } else {
            audio.source_loop[n][audio.compatibility.start](0, offset);
        }

        audio.source_loop[n]._playing = true;
    }
};

audio.stop = function(n) {
    if (audio.source_loop[n]._playing) {
        audio.source_loop[n][audio.compatibility.stop](0);
        audio.source_loop[n]._playing = false;
        audio.source_loop[n]._startTime = 0;
        if (audio.compatibility.start === 'noteOn') {
            audio.source_once[n][audio.compatibility.stop](0);
        }
    }
};

//-----------------------------
// Check Web Audio API Support
//-----------------------------
try {
    // More info at http://caniuse.com/#feat=audio-api
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audio.context = new window.AudioContext();
} catch(e) {
    audio.proceed = false;
    alert('Web Audio API not supported in this browser.');
}

if (audio.proceed) {
audio.master_setup();

    //---------------
    // Compatibility
    //---------------
    (function() {
        var start = 'start',
            stop = 'stop',
            buffer = audio.context.createBufferSource();

        if (typeof buffer.start !== 'function') {
            start = 'noteOn';
        }
        audio.compatibility.start = start;

        if (typeof buffer.stop !== 'function') {
            stop = 'noteOff';
        }
        audio.compatibility.stop = stop;
    })();

    //-------------------------------
    // Setup Audio Files and Buttons
    //-------------------------------
    for (var a in audio.files) {
        (function() {
            var i = parseInt(a) + 1;
            var req = new XMLHttpRequest();
            req.open('GET', audio.files[i - 1], true); // array starts with 0 hence the -1
            req.responseType = 'arraybuffer';
            req.onload = function() {
                audio.context.decodeAudioData(
                    req.response,
                    function(buffer) {
                        audio.buffer[i] = buffer;
                        audio.source_loop[i] = {};
          audio.setup_gain(i);
                        var button = document.getElementById('button-loop-' + i);
                        button.addEventListener('click', function(e) {
                            e.preventDefault();
            if (button.className !== 'click') {
              button.className = 'click';
            }
            else {
            button.className = 'button';
            }
                            audio.play(this.value);
                        });
                    },
                    function() {
                        console.log('Error decoding audio "' + audio.files[i - 1] + '".');
                    }
                );
            };
            req.send();
        })();
    }

}
