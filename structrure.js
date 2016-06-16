//initializing
ear = new Ear(song)

beat = new Beat(ear, options{frequency, threshold, decay})

//events triggered during song playback
beat.onBeat()
note.onNote(note, func)
kick.onKick(kick, func)
ear.onTreble()

//live data
beat.timeLeft
beat.amplitude
note.tone
note.amplitude
note.duration
note.timeLeft
ear.energy
ear.amplitude
ear.waveForm()
ear.spectrum()

//get raw music stream data
ear.music
    .play
    .stop
    .pause
    .setPosition
    .getPosition



//get music info
ear.getMaxAmplitude(start, stop)
ear.getMinAmplitude(start, stop)
ear.getTempo()
ear.getDuration()
ear.getNormalizedVolume()

//piping (for internal use and advanced usage)
low = Ear.filter(ear.music, lowpass) //low = audiobuffer?
kicks = Ear.kickDetect(low, options) //kicks = (time, intensity) array
beat = Ear.beatAnalyzer(kicks, options) //beat = number or list of times




//advanced analysis events. Not priority
ear.onDrop()
ear.onFadeOut()
ear.onIntroFinished()



//visualizer usage of Ear
dream = new Dream(ear)
eclipseViz = dream.visual(Circle, 14, options)

function Circle(){
    var options = {
        color: color || ear.note,
        radius: radius || ear.beat.timeLeft
    }



    function onUpdate() {
        canvas.startFill(options.color)
        canvas.drawCircle(options.radius)
    }
}
