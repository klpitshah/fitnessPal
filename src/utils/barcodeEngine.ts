import Quagga, { type QuaggaJSConfigObject, type QuaggaJSResultObject } from '@ericblade/quagga2'
import { BrowserMultiFormatOneDReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'

const QUAGGA_READERS = ['ean_reader', 'ean_8_reader', 'upc_reader', 'code_128_reader'] as const
const PRODUCT_FORMATS = ['upc_a', 'upc_e', 'ean_13', 'ean_8', 'code_128'] as const
const ENHANCED_SCALES = [1, 1.5, 2] as const
const AUTO_TORCH_BRIGHTNESS = 75
const REFOCUS_INTERVAL_MS = 2500

export function normalizeBarcode(raw: string): string {
  return raw.replace(/\D/g, '')
}

function createZxingReader() {
  const hints = new Map<DecodeHintType, unknown>([
    [DecodeHintType.TRY_HARDER, true],
    [
      DecodeHintType.POSSIBLE_FORMATS,
      [BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8],
    ],
  ])
  return new BrowserMultiFormatOneDReader(hints)
}

function createQuaggaConfig(target: HTMLElement): QuaggaJSConfigObject {
  const workers = Math.min(navigator.hardwareConcurrency || 2, 4)

  return {
    inputStream: {
      type: 'LiveStream',
      target,
      willReadFrequently: true,
      constraints: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        focusMode: 'continuous',
      } as MediaTrackConstraints,
    },
    frequency: 20,
    numOfWorkers: workers,
    locate: true,
    locator: {
      halfSample: false,
      patchSize: 'large',
    },
    canvas: {
      createOverlay: false,
    },
    decoder: {
      readers: [...QUAGGA_READERS],
    },
  }
}

async function createNativeDetector(): Promise<BarcodeDetector | null> {
  if (!('BarcodeDetector' in globalThis)) return null
  try {
    const supported = await BarcodeDetector.getSupportedFormats()
    const formats = PRODUCT_FORMATS.filter((f) => supported.includes(f))
    if (formats.length === 0) return null
    return new BarcodeDetector({ formats: [...formats] })
  } catch {
    return null
  }
}

function getVideoFromTarget(target: HTMLElement): HTMLVideoElement | null {
  return target.querySelector('video')
}

function getStreamFromTarget(target: HTMLElement): MediaStream | null {
  const video = getVideoFromTarget(target)
  return video?.srcObject instanceof MediaStream ? video.srcObject : null
}

async function applyContinuousFocus(stream: MediaStream): Promise<void> {
  const track = stream.getVideoTracks()[0]
  if (!track) return

  const caps = track.getCapabilities?.() as MediaTrackCapabilitiesWithTorch | undefined
  if (!caps?.focusMode?.includes('continuous')) return

  try {
    await track.applyConstraints({
      advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSetWithTorch],
    })
  } catch {
    // ignored — not all devices support programmatic focus
  }
}

async function triggerRefocus(stream: MediaStream): Promise<void> {
  const track = stream.getVideoTracks()[0]
  if (!track) return

  const caps = track.getCapabilities?.() as MediaTrackCapabilitiesWithTorch | undefined
  if (!caps?.focusMode) return

  try {
    if (caps.focusMode.includes('single-shot')) {
      await track.applyConstraints({
        advanced: [{ focusMode: 'single-shot' } as MediaTrackConstraintSetWithTorch],
      })
    }
    if (caps.focusMode.includes('continuous')) {
      await track.applyConstraints({
        advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSetWithTorch],
      })
    }
  } catch {
    // ignored
  }
}

function drawEnhancedFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): number | null {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (vw <= 0 || vh <= 0) return null

  canvas.width = vw
  canvas.height = vh
  ctx.drawImage(video, 0, 0, vw, vh)

  const imageData = ctx.getImageData(0, 0, vw, vh)
  const pixels = imageData.data
  let brightnessSum = 0
  let samples = 0

  for (let i = 0; i < pixels.length; i += 4) {
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
    if (i % 16 === 0) {
      brightnessSum += gray
      samples += 1
    }
    const contrasted = Math.max(0, Math.min(255, (gray - 45) * (255 / 150)))
    pixels[i] = contrasted
    pixels[i + 1] = contrasted
    pixels[i + 2] = contrasted
  }

  ctx.putImageData(imageData, 0, 0)
  return samples > 0 ? brightnessSum / samples : null
}

function decodeWithZxing(reader: BrowserMultiFormatOneDReader, canvas: HTMLCanvasElement): string | null {
  try {
    return normalizeBarcode(reader.decodeFromCanvas(canvas).getText())
  } catch (err) {
    if (err instanceof NotFoundException) return null
    return null
  }
}

export type BarcodeScanHandle = {
  stop: () => void
  getStream: () => MediaStream | null
  hasTorch: () => boolean
  setTorch: (on: boolean) => Promise<boolean>
  refocus: () => Promise<void>
}

export async function startBarcodeScan(
  target: HTMLElement,
  onDetected: (barcode: string) => void,
  onAutoTorch?: (on: boolean) => void,
): Promise<BarcodeScanHandle> {
  let stopped = false
  let nativeFrameId: number | null = null
  let enhancedIntervalId: number | null = null
  let refocusIntervalId: number | null = null
  let torchEnabled = false
  let autoTorchTried = false

  const zxingReader = createZxingReader()
  const enhancedCanvas = document.createElement('canvas')
  const enhancedCtx = enhancedCanvas.getContext('2d', { willReadFrequently: true })
  const scaleCanvas = document.createElement('canvas')
  const scaleCtx = scaleCanvas.getContext('2d', { willReadFrequently: true })

  const acceptBarcode = (raw: string): boolean => {
    if (stopped) return false
    const value = normalizeBarcode(raw)
    if (value.length < 8) return false
    stopped = true
    cleanup()
    onDetected(value)
    return true
  }

  const handleQuaggaDetected = (result: QuaggaJSResultObject) => {
    const raw = result.codeResult?.code
    if (raw) acceptBarcode(raw)
  }

  await new Promise<void>((resolve, reject) => {
    Quagga.init(createQuaggaConfig(target), (err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  Quagga.onDetected(handleQuaggaDetected)
  Quagga.start()

  const stream = getStreamFromTarget(target)
  if (stream) void applyContinuousFocus(stream)

  const detector = await createNativeDetector()
  const video = getVideoFromTarget(target)

  async function tryNativeDetect(source: ImageBitmapSource): Promise<boolean> {
    if (!detector) return false
    try {
      const codes = await detector.detect(source)
      if (codes.length > 0) return acceptBarcode(codes[0].rawValue)
    } catch {
      // keep scanning
    }
    return false
  }

  async function tryEnhancedPass(): Promise<void> {
    if (stopped || !video || !enhancedCtx || !scaleCtx) return
    if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return

    const brightness = drawEnhancedFrame(video, enhancedCanvas, enhancedCtx)
    if (brightness === null) return

    if (
      !autoTorchTried &&
      brightness < AUTO_TORCH_BRIGHTNESS &&
      stream &&
      !torchEnabled
    ) {
      autoTorchTried = true
      const track = stream.getVideoTracks()[0]
      const caps = track?.getCapabilities?.() as MediaTrackCapabilitiesWithTorch | undefined
      if (caps?.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: true } as MediaTrackConstraintSetWithTorch],
          })
          torchEnabled = true
          onAutoTorch?.(true)
        } catch {
          // ignored
        }
      }
    }

    if (await tryNativeDetect(enhancedCanvas)) return

    for (const scale of ENHANCED_SCALES) {
      scaleCanvas.width = Math.floor(enhancedCanvas.width * scale)
      scaleCanvas.height = Math.floor(enhancedCanvas.height * scale)
      scaleCtx.imageSmoothingEnabled = scale !== 1
      scaleCtx.drawImage(enhancedCanvas, 0, 0, scaleCanvas.width, scaleCanvas.height)

      const zxingValue = decodeWithZxing(zxingReader, scaleCanvas)
      if (zxingValue && zxingValue.length >= 8 && acceptBarcode(zxingValue)) return
    }
  }

  if (detector && video) {
    const nativeTick = async () => {
      if (stopped) return
      if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        if (await tryNativeDetect(video)) return
      }
      nativeFrameId = requestAnimationFrame(() => {
        void nativeTick()
      })
    }
    void nativeTick()
  }

  enhancedIntervalId = window.setInterval(() => {
    void tryEnhancedPass()
  }, 100)

  if (stream) {
    refocusIntervalId = window.setInterval(() => {
      if (!stopped) void triggerRefocus(stream)
    }, REFOCUS_INTERVAL_MS)
  }

  function cleanup() {
    if (nativeFrameId !== null) {
      cancelAnimationFrame(nativeFrameId)
      nativeFrameId = null
    }
    if (enhancedIntervalId !== null) {
      window.clearInterval(enhancedIntervalId)
      enhancedIntervalId = null
    }
    if (refocusIntervalId !== null) {
      window.clearInterval(refocusIntervalId)
      refocusIntervalId = null
    }
    Quagga.offDetected(handleQuaggaDetected)
    void Quagga.stop()
  }

  return {
    stop: () => {
      if (stopped) return
      stopped = true
      cleanup()
    },
    getStream: () => getStreamFromTarget(target),
    hasTorch: () => {
      const activeStream = getStreamFromTarget(target)
      const track = activeStream?.getVideoTracks()[0]
      const caps = track?.getCapabilities?.() as MediaTrackCapabilitiesWithTorch | undefined
      return Boolean(caps?.torch)
    },
    setTorch: async (on: boolean) => {
      const activeStream = getStreamFromTarget(target)
      const track = activeStream?.getVideoTracks()[0]
      if (!track) return false

      const caps = track.getCapabilities?.() as MediaTrackCapabilitiesWithTorch | undefined
      if (!caps?.torch) return false

      try {
        await track.applyConstraints({
          advanced: [{ torch: on } as MediaTrackConstraintSetWithTorch],
        })
        torchEnabled = on
        return true
      } catch {
        return false
      }
    },
    refocus: async () => {
      const activeStream = getStreamFromTarget(target)
      if (activeStream) await triggerRefocus(activeStream)
    },
  }
}

export function getCameraErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'NotAllowedError') {
      return 'Camera permission denied. Allow camera access in browser settings, or enter the barcode manually below.'
    }
    if (err.name === 'NotFoundError') {
      return 'No camera found on this device. Enter the barcode manually below.'
    }
    if (err.name === 'NotReadableError') {
      return 'Camera is in use by another app. Close it and try again.'
    }
    return err.message
  }
  return 'Could not access camera.'
}
