import { BrowserMultiFormatOneDReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    focusMode: { ideal: 'continuous' },
  } as MediaTrackConstraints,
}

const PRODUCT_FORMATS = ['upc_a', 'upc_e', 'ean_13', 'ean_8', 'code_128'] as const

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

function drawCropFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (vw <= 0 || vh <= 0) return false

  const cropW = Math.floor(vw * 0.85)
  const cropH = Math.floor(vh * 0.4)
  const cropX = Math.floor((vw - cropW) / 2)
  const cropY = Math.floor((vh - cropH) / 2)
  const scale = 2

  canvas.width = cropW * scale
  canvas.height = cropH * scale
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height)
  return true
}

function decodeWithZxing(reader: BrowserMultiFormatOneDReader, canvas: HTMLCanvasElement): string | null {
  try {
    return normalizeBarcode(reader.decodeFromCanvas(canvas).getText())
  } catch (err) {
    if (err instanceof NotFoundException) return null
    return null
  }
}

export type BarcodeScanStop = () => void

export async function startBarcodeScan(
  video: HTMLVideoElement,
  onDetected: (barcode: string) => void,
): Promise<BarcodeScanStop> {
  let stopped = false
  const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS)
  video.srcObject = stream
  video.setAttribute('playsinline', 'true')
  await video.play()

  const [detector, reader] = await Promise.all([createNativeDetector(), Promise.resolve(createZxingReader())])
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Could not initialize scanner')
  const canvasCtx = ctx

  let busy = false

  async function tick() {
    if (stopped || busy) return
    if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      scheduleNext()
      return
    }

    busy = true
    try {
      if (!drawCropFrame(video, canvas, canvasCtx)) {
        return
      }

      if (detector) {
        for (const source of [video, canvas]) {
          try {
            const codes = await detector.detect(source)
            if (codes.length > 0) {
              const value = normalizeBarcode(codes[0].rawValue)
              if (value.length >= 8) {
                onDetected(value)
                return
              }
            }
          } catch {
            // try next source
          }
        }
      }

      const zxingValue = decodeWithZxing(reader, canvas)
      if (zxingValue && zxingValue.length >= 8) {
        onDetected(zxingValue)
      }
    } catch {
      // keep scanning
    } finally {
      busy = false
      scheduleNext()
    }
  }

  function scheduleNext() {
    if (!stopped) window.setTimeout(tick, 80)
  }

  tick()

  return () => {
    stopped = true
    stream.getTracks().forEach((track) => track.stop())
    video.srcObject = null
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
