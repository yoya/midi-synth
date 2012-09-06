var voices = new Array();
var audioContext = null;
var FOURIER_SIZE = 4096;
var wave = false;
var ATTACKTIME = 0.01;
var RELEASETIME = 1;
var currentFilterFrequency = 2500;
var currentFilterQ = 10;
var synthBox = null;
var keys = new Array( 256 );
keys[65] = 60; // = C4
keys[87] = 61;
keys[83] = 62;
keys[69] = 63;
keys[68] = 64;
keys[70] = 65; // = F4
keys[84] = 66;
keys[71] = 67;
keys[89] = 68;
keys[72] = 69;
keys[85] = 70;
keys[74] = 71;
keys[75] = 72; // = C5
keys[79] = 73;
keys[76] = 74;
keys[80] = 75;
keys[186] = 76;
keys[222] = 77; // = F5
keys[221] = 78;
keys[13] = 79;
keys[220] = 80;

function frequencyFromNoteNumber( note ) {
	return 440 * Math.pow(2,(note-69)/12);
}

function noteOn( note, velocity ) {
	if (voices[note] == null) {
		// Create a new synth node
		voices[note] = new Voice(note, velocity);
	}
}

function noteOff( note ) {
	if (voices[note] != null) {
		// Shut off the note playing and clear it 
		voices[note].noteOff();
		voices[note] = null;
	}

}

function onUpdateFilterFrequency( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	console.log("update Filter Freq: " + value);
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterFrequency( value );
		}
	}
}

function controller( number, value ) {
	if (number == 1) {
		currentFilterFrequency = 5000 * value;
		$("#ffreq input").val( currentFilterFrequency );
    	$("#ffreq input").trigger('change');
		return;
	} else if (number == 2)
	  	currentFilterQ = 20 * value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			if (number == 1)
				voices[i].setFilterFrequency(value * 5000);
			else if (number == 2)
				voices[i].setFilterQ(value);
		}
	}
}

/*
	if ( wave ) {
		var real = new Float32Array(FOURIER_SIZE);
		var imag = new Float32Array(FOURIER_SIZE);
		real[0] = 0.0;
		imag[0] = 0.0;

		for (var i=1; i<FOURIER_SIZE; i++) {
			real[i]=1.0;
			imag[i]=1.0;
		}

		var wavetable = audioContext.createWaveTable(real, imag);
		oscillatorNode.setWaveTable(wavetable);
	} else {

*/
function Voice( note, velocity ) {
	this.osc = audioContext.createOscillator();
	this.osc.frequency.value = frequencyFromNoteNumber( note );
	this.osc.type = this.osc.TRIANGLE;
	this.envelope = audioContext.createGainNode();
	this.gain = audioContext.createGainNode();
	this.gain.gain.value = 0.05 + (0.33 * velocity);
	this.osc.connect( this.gain );
	this.filter = audioContext.createBiquadFilter();
	this.filter.type = this.filter.LOWPASS;
	this.filter.frequency.value = currentFilterFrequency;
	this.filter.Q.value = currentFilterQ;
	this.gain.connect( this.filter );
	this.filter.connect( this.envelope );
	this.envelope.connect( audioContext.destination );
	var now = audioContext.currentTime;
	this.envelope.gain.setValueAtTime( 0, now );
	this.envelope.gain.linearRampToValueAtTime( 1.0, now + ATTACKTIME );
	this.osc.noteOn(0);
}

Voice.prototype.setFilterFrequency = function( value ) {
	// value is 0-1; scale to 0-5000.

//	this.filter.frequency.setTargetValueAtTime( value * 5000, audioContext.currentTime, 0.1 );
	this.filter.frequency.value = value;
}

Voice.prototype.setFilterQ = function( value ) {
	// value is 0-1; scale to 0-20.

//	this.filter.Q.setTargetValueAtTime( value * 20, audioContext.currentTime, 0.1 );
	this.filter.Q.value = value * 20;
}

Voice.prototype.noteOff = function() {
	var now =  audioContext.currentTime;
	this.envelope.gain.setValueAtTime( this.envelope.gain.value, now );
	this.envelope.gain.linearRampToValueAtTime( 0.0, now + RELEASETIME );
	this.osc.noteOff( now + RELEASETIME );
}

function keyDown( ev ) {
	var note = keys[ev.keyCode];
	if (note)
		noteOn( note, 0.75 );
//	console.log( "key down: " + ev.keyCode );
	return false;
}

function keyUp( ev ) {
	var note = keys[ev.keyCode];
	if (note)
		noteOff( note );
//	console.log( "key up: " + ev.keyCode );
	return false;
}

function initAudio() {
	try {
    	audioContext = new webkitAudioContext();
  	}
  	catch(e) {
    	alert('Web Audio API is not supported in this browser');
  	}
	window.addEventListener('keydown', keyDown, false);
	window.addEventListener('keyup', keyUp, false);
	synthBox = document.getElementById("synthbox");
	setupSynthUI();
}

window.onload=initAudio;
