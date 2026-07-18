let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function play(notes: { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number }[]) {
  const c = getCtx()
  notes.forEach(({ freq, start, duration, type = 'sine', gain: g = 0.15 }) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime + start)
    gain.gain.setValueAtTime(0, c.currentTime + start)
    gain.gain.linearRampToValueAtTime(g, c.currentTime + start + 0.02)
    gain.gain.linearRampToValueAtTime(0, c.currentTime + start + duration)
    osc.connect(gain).connect(c.destination)
    osc.start(c.currentTime + start)
    osc.stop(c.currentTime + start + duration + 0.05)
  })
}

export function bootSound() {
  play([
    { freq: 523.25, start: 0, duration: 3.5, type: 'sine', gain: 0.12 },
    { freq: 659.25, start: 0.15, duration: 3.2, type: 'sine', gain: 0.10 },
    { freq: 783.99, start: 0.3, duration: 2.8, type: 'sine', gain: 0.08 },
    { freq: 1046.5, start: 0.6, duration: 2.5, type: 'sine', gain: 0.06 },
  ])
}

export function addTodoSound() {
  play([
    { freq: 880, start: 0, duration: 0.1, type: 'sine', gain: 0.12 },
    { freq: 1108, start: 0.06, duration: 0.08, type: 'sine', gain: 0.08 },
  ])
}

export function toggleDoneSound() {
  play([
    { freq: 659.25, start: 0, duration: 0.08, type: 'sine', gain: 0.1 },
    { freq: 880, start: 0.05, duration: 0.15, type: 'triangle', gain: 0.08 },
  ])
}

export function toggleUndoneSound() {
  play([
    { freq: 440, start: 0, duration: 0.1, type: 'sine', gain: 0.08 },
    { freq: 349.23, start: 0.05, duration: 0.12, type: 'sine', gain: 0.06 },
  ])
}

export function deleteTodoSound() {
  play([
    { freq: 600, start: 0, duration: 0.15, type: 'sawtooth', gain: 0.05 },
    { freq: 300, start: 0.05, duration: 0.2, type: 'sawtooth', gain: 0.04 },
    { freq: 150, start: 0.12, duration: 0.25, type: 'sawtooth', gain: 0.03 },
  ])
}

export function successSound() {
  play([
    { freq: 523.25, start: 0, duration: 0.25, type: 'sine', gain: 0.1 },
    { freq: 659.25, start: 0.15, duration: 0.25, type: 'sine', gain: 0.1 },
    { freq: 783.99, start: 0.3, duration: 0.4, type: 'sine', gain: 0.1 },
  ])
}

export function celebrateSound() {
  play([
    { freq: 523.25, start: 0, duration: 0.3, type: 'sine', gain: 0.12 },
    { freq: 659.25, start: 0.15, duration: 0.3, type: 'sine', gain: 0.12 },
    { freq: 783.99, start: 0.3, duration: 0.3, type: 'sine', gain: 0.12 },
    { freq: 1046.5, start: 0.45, duration: 0.6, type: 'sine', gain: 0.15 },
  ])
}
