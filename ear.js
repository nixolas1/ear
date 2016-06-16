(function() {

  var SAMPLE_SIZE = 2048;
  var SAMPLE_RATE = 44100;

  var Ear = function () {
    this.events = {};
    this.sections = [];
    this.audio = new Audio();
    this.context = window.AudioContext ? new window.AudioContext() : new window.webkitAudioContext();
    this.bind('update', update);
  };

  Ear.prototype = {

    /* Controls */

    play : function () {
      this.audio.play();
      this.isPlaying = true;
      return this;
    },

    pause : function () {
      this.audio.pause();
      this.isPlaying = false;
      return this;
    },

    stop : function () {
      this.audio.stop();
      this.isPlaying = false;
      return this;
    },

    //What is max?
    setVolume : function (volume) {
      this.gain.gain.value = volume;
      return this;
    },

    seek : function (time){
      if (time === undefined) return;
      if (time > this.audio.duration) {
        console.log("[ERROR] Seek time is greater than duration of audio buffer.");
        return false;
      }

      if (this.isPlaying) {
        this.audio.stop(); // Stop any existing playback if there is any
        this.audio.playbackTime = time;
        this.audio.play(); // Resume playback at new time
      } else {
        this.audio.playbackTime = time;
      }

      return this;
    },


    /* Actions */


    bind : function (name, callback) {
      if (!this.events[name])
        this.events[name] = [];
  
      this.events[name].push(callback);
      return this;
    },

    unbind : function (name) {
      if (this.events[name]) {
        delete this.events[name];
      }
      return this;
    },

    trigger : function (name) {
      var _this = this;
      if (this.events[name]) {
        this.events[name].forEach(function(callback) {
          callback.call(_this);
        });
      } else {
        console.log(name, "is not a defined action to trigger.")
      }
      return this;
    },


    /* Getters */

    getVolume : function () {
      return this.gain.gain.value;
    },

    getProgress : function () {
      return this.progress;
    },

    getDuration : function () {
      return this.audio.duration;
    },

    getTime : function () {
      return this.audio.currentTime;
    },

    // Returns the magnitude of a frequency or average over a range of frequencies
    getFrequency : function (freq, endFreq) {
      var sum = 0;
      if (endFreq !== undefined) {
        for (var i = freq; i <= endFreq; i++) {
          sum += this.getSpectrum()[i];
        }
        return sum / (endFreq - freq + 1);
      } 
      else return this.getSpectrum()[freq];
    },

    getWaveform : function () {
      return this.signal;
    },

    getSpectrum : function () {
      return this.fft.spectrum;
    },

    isLoaded : function () {
      return this.isLoaded;
    },

    isPlaying : function () {
      return this.isPlaying;
    },


    /* Sections */

    after : function (time, callback) {
      var _this = this;
      this.sections.push({
        condition : function () {
          return _this.getTime() > time;
        },
        callback : callback
      });
      return this;
    },

    before : function (time, callback) {
      var _this = this;
      this.sections.push({
        condition : function () {
          return _this.getTime() < time;
        },
        callback : callback
      });
      return this;
    },

    between : function (startTime, endTime, callback) {
      var _this = this;
      this.sections.push({
        condition : function () {
          return _this.getTime() > startTime && _this.getTime() < endTime;
        },
        callback : callback
      });
      return this;
    },

    onceAt : function (time, callback) {
      var
        _this = this,
        thisSection = null;
      this.sections.push({
        condition : function () {
          return _this.getTime() > time && !this.called;
        },
        callback : function () {
          callback.call(this);
          thisSection.called = true;
        },
        called : false
      });
      // Baking the section in the closure due to callback's this being the dancer instance
      thisSection = this.sections[this.sections.length - 1];
      return this;
    },

    //initialize source
    load : function (source) {
      var path;

      // Loading an Audio element
      if (source instanceof HTMLElement) {
        this.source = source;

      // Loading an object with src, [codecs]
      } else {
        this.source = window.Audio ? new Audio() : {};
        this.source.src = Ear._makeSupportedPath(source.src, source.codecs);
      }

      this.audio = source;

      this.isLoaded = false;
      this.progress = 0;

      if (!this.context.createScriptProcessor) {
        this.context.createScriptProcessor = this.context.createJavascriptNode;
      }

      this.proc = this.context.createScriptProcessor(SAMPLE_SIZE / 2, 1, 1);

      this.proc.onaudioprocess = function (e) {
        this.update.call(this, e);
      };

      if (!this.context.createGain) {
        this.context.createGain = this.context.createGainNode;
      }

      this.gain = this.context.createGain();

      this.fft = new FFT(SAMPLE_SIZE / 2, SAMPLE_RATE);
      this.signal = new Float32Array(SAMPLE_SIZE / 2);

      if (this.audio.readyState < 3) {
        this.audio.addEventListener( 'canplay', function () {
          connectContext.call(this);
        });
      } else {
        connectContext.call(this);
      }

      this.audio.addEventListener('progress', function (e) {
        if (e.currentTarget.duration) {
          this.progress = e.currentTarget.seekable.end(0) / e.currentTarget.duration;
        }
      });

      return this;
    },


    update : function (e) {
      if (!this.isPlaying || !this.isLoaded) return;

      var buffers = [],
          channels = e.inputBuffer.numberOfChannels,
          resolution = SAMPLE_SIZE / channels,
          i;
      var sum = function (prev, curr) {
        return prev[i] + curr[i];
      }

      for (i = channels; i--;) {
        buffers.push(e.inputBuffer.getChannelData( i ));
      }

      for (i = 0; i < resolution; i++) {
        this.signal[i] = channels > 1 ?
          buffers.reduce(sum) / channels :
          buffers[0][i];
      }

      this.fft.forward(this.signal);
      this.dancer.trigger('update');
    }

  };

  function update () {
    for (var i in this.sections) {
      if (this.sections[i].condition())
        this.sections[i].callback.call(this);
    }
  }

  function connectContext () {
    this.source = this.context.createMediaElementSource(this.audio);
    this.source.connect(this.proc);
    this.source.connect(this.gain);
    this.gain.connect(this.context.destination);
    this.proc.connect(this.context.destination);

    this.isLoaded = true;
    this.progress = 1;
    this.dancer.trigger('loaded');
  }

  window.Ear = Ear;
})();
