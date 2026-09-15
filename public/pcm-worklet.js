// AudioWorklet : convertit le flux micro (souvent 48 kHz float) en PCM 16 kHz Int16 mono
// pour la transcription en direct. Envoie un bloc toutes les ~100 ms.
class PcmDownsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.buffer = [];
    this.pos = 0;
    this.chunk = 1600; // 100 ms à 16 kHz
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;
    while (this.pos < input.length) {
      const s = Math.max(-1, Math.min(1, input[Math.floor(this.pos)]));
      this.buffer.push(s < 0 ? s * 0x8000 : s * 0x7fff);
      this.pos += this.ratio;
    }
    this.pos -= input.length;
    if (this.buffer.length >= this.chunk) {
      const out = Int16Array.from(this.buffer.splice(0, this.chunk));
      this.port.postMessage(out.buffer, [out.buffer]);
    }
    return true;
  }
}

registerProcessor("pcm-downsampler", PcmDownsampler);
