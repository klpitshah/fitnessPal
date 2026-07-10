import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getCameraErrorMessage,
  normalizeBarcode,
  startBarcodeScan,
  type BarcodeScanHandle,
} from '../utils/barcodeEngine'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onManualEntry: (barcode: string) => void
}

export function BarcodeScanner({ onScan, onManualEntry }: BarcodeScannerProps) {
  const scannerTargetRef = useRef<HTMLDivElement>(null)
  const scanHandleRef = useRef<BarcodeScanHandle | null>(null)
  const onScanRef = useRef(onScan)
  const scannedRef = useRef(false)
  const autoStartedRef = useRef(false)

  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [scanHint, setScanHint] = useState('Tap the screen if the barcode looks blurry.')

  onScanRef.current = onScan

  const stopCamera = useCallback(() => {
    scanHandleRef.current?.stop()
    scanHandleRef.current = null
    setTorchOn(false)
    setTorchAvailable(false)
    setCameraState('idle')
    setScanHint('Tap the screen if the barcode looks blurry.')
  }, [])

  const handleDetected = useCallback((raw: string) => {
    if (scannedRef.current) return
    scannedRef.current = true
    scanHandleRef.current?.stop()
    scanHandleRef.current = null
    setTorchOn(false)
    setTorchAvailable(false)
    setScanHint(`Found: ${raw}`)
    onScanRef.current(raw)
  }, [])

  const startCamera = useCallback(async () => {
    const target = scannerTargetRef.current
    if (!target) return
    if (cameraState === 'starting') return

    stopCamera()
    scannedRef.current = false
    setCameraState('starting')
    setError(null)
    setScanHint('Starting camera…')

    try {
      const handle = await startBarcodeScan(target, handleDetected, (on) => {
        setTorchOn(on)
      })
      scanHandleRef.current = handle
      setTorchAvailable(handle.hasTorch())
      setCameraState('active')
      setScanHint('If it won\u2019t scan, tap the screen to focus or move back slightly.')
    } catch (err) {
      stopCamera()
      setCameraState('error')
      setError(getCameraErrorMessage(err))
    }
  }, [cameraState, stopCamera, handleDetected])

  const toggleTorch = useCallback(async () => {
    const handle = scanHandleRef.current
    if (!handle) return
    const next = !torchOn
    const ok = await handle.setTorch(next)
    if (ok) setTorchOn(next)
  }, [torchOn])

  const handleViewportTap = useCallback(() => {
    if (cameraState !== 'active') return
    void scanHandleRef.current?.refocus()
    setScanHint('Refocusing… hold steady.')
    window.setTimeout(() => {
      setScanHint('If it won\u2019t scan, tap the screen to focus or move back slightly.')
    }, 1200)
  }, [cameraState])

  useEffect(() => {
    if (!window.isSecureContext || autoStartedRef.current) return
    autoStartedRef.current = true
    void startCamera()
  }, [startCamera])

  useEffect(() => {
    return () => {
      scanHandleRef.current?.stop()
      scanHandleRef.current = null
    }
  }, [])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = normalizeBarcode(manualBarcode)
    if (!code) return
    stopCamera()
    onManualEntry(code)
  }

  return (
    <div className="barcode-scanner">
      <h2 className="section-title">Scan Barcode</h2>
      <p className="section-subtitle">Point your camera at a product barcode (UPC/EAN)</p>

      <div className="scanner-viewport" onClick={handleViewportTap}>
        <div ref={scannerTargetRef} className="scanner-target" />
        {cameraState === 'active' && (
          <>
            <div className="scanner-overlay" />
            <div className="scanner-scanline" aria-hidden="true" />
          </>
        )}
        {cameraState !== 'active' && (
          <div className="scanner-placeholder">
            {cameraState === 'starting' ? (
              <p>Starting camera…</p>
            ) : (
              <button type="button" className="btn btn--primary" onClick={startCamera}>
                Start Camera
              </button>
            )}
          </div>
        )}
      </div>

      <p className={`scanner-status ${cameraState === 'active' ? 'scanner-status--active' : ''}`}>{scanHint}</p>

      {cameraState === 'active' && (
        <div className="scanner-controls">
          {torchAvailable && (
            <button type="button" className="btn btn--secondary scanner-torch-btn" onClick={toggleTorch}>
              {torchOn ? 'Turn Off Flash' : 'Turn On Flash'}
            </button>
          )}
          <button type="button" className="btn btn--secondary btn--full scanner-stop-btn" onClick={stopCamera}>
            Stop Camera
          </button>
        </div>
      )}

      {cameraState === 'error' && (
        <button type="button" className="btn btn--secondary btn--full scanner-retry-btn" onClick={startCamera}>
          Try Camera Again
        </button>
      )}

      {error && <p className="error-message">{error}</p>}

      {!window.isSecureContext && (
        <p className="error-message">
          Camera requires HTTPS. Use localhost on your computer, or deploy the app for phone use.
        </p>
      )}

      <div className="manual-barcode">
        <p className="section-subtitle">Or enter barcode manually</p>
        <form onSubmit={handleManualSubmit} className="manual-barcode__form">
          <input
            type="text"
            inputMode="numeric"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="e.g. 009800802203"
            className="manual-barcode__input"
          />
          <button type="submit" className="btn btn--primary">
            Look Up
          </button>
        </form>
      </div>
    </div>
  )
}
