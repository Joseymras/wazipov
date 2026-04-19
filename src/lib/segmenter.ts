// Lazy-loaded MediaPipe selfie segmentation (CDN). Returns a function that
// segments a video frame into a Uint8 mask (255 = person, 0 = background).
// Falls back to a "no mask" passthrough if the model fails to load.

let segmenter: any = null;
let loading: Promise<any> | null = null;

declare global {
  interface Window { __mpVision?: any }
}

async function loadVisionTasks() {
  if (window.__mpVision) return window.__mpVision;
  // Load the WASM tasks-vision bundle via dynamic ESM import from CDN
  const mod: any = await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
  );
  window.__mpVision = mod;
  return mod;
}

export async function getSegmenter() {
  if (segmenter) return segmenter;
  if (loading) return loading;
  loading = (async () => {
    try {
      const vision = await loadVisionTasks();
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      segmenter = await vision.ImageSegmenter.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });
      return segmenter;
    } catch (e) {
      console.warn("Segmenter failed to load", e);
      return null;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Apply a background image/color behind the person on a canvas (in-place). */
export function compositeWithBackground(
  ctx: CanvasRenderingContext2D,
  videoFrame: HTMLVideoElement | HTMLCanvasElement,
  mask: Uint8Array | null,
  width: number,
  height: number,
  background: HTMLImageElement | string,
  mirror = false,
) {
  // 1. Draw background
  if (typeof background === "string") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.drawImage(background, 0, 0, width, height);
  }

  if (!mask) {
    // No segmentation — just composite the source on top
    if (mirror) { ctx.save(); ctx.translate(width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(videoFrame, 0, 0, width, height);
    if (mirror) ctx.restore();
    return;
  }

  // 2. Draw the source frame to an offscreen canvas
  const off = document.createElement("canvas");
  off.width = width; off.height = height;
  const octx = off.getContext("2d")!;
  if (mirror) { octx.save(); octx.translate(width, 0); octx.scale(-1, 1); }
  octx.drawImage(videoFrame, 0, 0, width, height);
  if (mirror) octx.restore();

  const img = octx.getImageData(0, 0, width, height);
  // Mask is mp's category mask: 0 = person, others = bg (selfie segmenter outputs binary)
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    // Treat low values as person (foreground)
    if (mask[i] !== 0) img.data[p + 3] = 0; // background → transparent
  }
  octx.putImageData(img, 0, 0);

  ctx.drawImage(off, 0, 0, width, height);
}
