let ctx: AudioContext | null = null
let unlocked = false

async function getCtx() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx
}

function play(notes: { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number }[]) {
  if (!ctx) return
  notes.forEach(({ freq, start, duration, type = 'sine', gain: g = 0.06 }) => {
    const osc = ctx!.createOscillator()
    const gain = ctx!.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx!.currentTime + start)
    gain.gain.setValueAtTime(0, ctx!.currentTime + start)
    gain.gain.linearRampToValueAtTime(g, ctx!.currentTime + start + 0.04)
    gain.gain.setValueAtTime(g, ctx!.currentTime + start + duration * 0.6)
    gain.gain.linearRampToValueAtTime(0, ctx!.currentTime + start + duration)
    osc.connect(gain).connect(ctx!.destination)
    osc.start(ctx!.currentTime + start)
    osc.stop(ctx!.currentTime + start + duration + 0.05)
  })
}

export async function unlockAudio() {
  if (unlocked) return
  await getCtx()
  unlocked = true
  bootSound()
}

function bootSound() {
  play([
    { freq: 220, start: 0, duration: 4, type: 'triangle', gain: 0.04 },
    { freq: 330, start: 0.3, duration: 3.5, type: 'triangle', gain: 0.03 },
    { freq: 440, start: 0.7, duration: 3, type: 'triangle', gain: 0.025 },
  ])
}

export async function successSound() {
  await getCtx()
  play([
    { freq: 523.25, start: 0, duration: 0.6, type: 'triangle', gain: 0.05 },
    { freq: 659.25, start: 0.25, duration: 0.5, type: 'triangle', gain: 0.04 },
  ])
}

export async function celebrateSound() {
  await getCtx()
  play([
    { freq: 523.25, start: 0, duration: 0.5, type: 'triangle', gain: 0.05 },
    { freq: 659.25, start: 0.2, duration: 0.5, type: 'triangle', gain: 0.05 },
    { freq: 783.99, start: 0.4, duration: 0.6, type: 'triangle', gain: 0.04 },
  ])
}
