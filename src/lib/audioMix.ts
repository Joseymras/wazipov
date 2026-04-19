// Mixes a music URL into a MediaStream so MediaRecorder captures both
// the camera audio (mic) and a soundtrack.

export async function buildMixedStream(
  videoStream: MediaStream,
  musicUrl?: string | null,
  micEnabled = true,
): Promise<{ stream: MediaStream; cleanup: () => void }> {
  const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
  const dest = ac.createMediaStreamDestination();
  const cleanups: Array<() => void> = [() => ac.close()];

  // Mic
  if (micEnabled) {
    const audioTracks = videoStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const micStream = new MediaStream(audioTracks);
      const micSrc = ac.createMediaStreamSource(micStream);
      const micGain = ac.createGain();
      micGain.gain.value = 1.0;
      micSrc.connect(micGain).connect(dest);
    }
  }

  // Music
  let musicEl: HTMLAudioElement | null = null;
  if (musicUrl) {
    musicEl = new Audio(musicUrl);
    musicEl.crossOrigin = "anonymous";
    musicEl.loop = true;
    musicEl.volume = 0.7;
    try {
      await musicEl.play();
      const musicSrc = ac.createMediaElementSource(musicEl);
      const musicGain = ac.createGain();
      musicGain.gain.value = 0.6;
      musicSrc.connect(musicGain).connect(dest);
    } catch (e) {
      console.warn("Music play failed", e);
    }
    cleanups.push(() => { musicEl?.pause(); });
  }

  // Combine: video tracks + mixed audio
  const merged = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  return { stream: merged, cleanup: () => cleanups.forEach(c => c()) };
}
