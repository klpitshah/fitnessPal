import { useCallback, useEffect, useRef, useState } from 'react'
import { getCameraErrorMessage, normalizeBarcode, startBarcodeScan, type BarcodeScanStop } from '../utils/barcodeEngine'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onManualEntry: (barcode: string) => void
}

export function BarcodeScanner({ onScan, onManualEntry }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stopScanRef = useRef<BarcodeScanStop | null>(null)
  const onScanRef = useRef(onScan)
  const scannedRef = useRef(false)

  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const [scanHint, setScanHint] = useState('Tap Start Camera, then align the barcode in the green box.')

  onScanRef.current = onScan

  const stopCamera = useCallback(() => {
    stopScanRef.current?.()
    stopScanRef.current = null
    setCameraState('idle')
    setScanHint('Tap Start Camera, then align the barcode in the green box.')
  }, [])

  const handleDetected = useCallback(
    (raw: string) => {
      if (scannedRef.current) return
      scannedRef.current = true
      stopScanRef.current?.()
      stopScanRef.current = null
      setScanHint(`Found: ${raw}`)
      onScanRef.current(raw)
    },
    [],
  )

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return
    if (cameraState === 'starting') return

    stopCamera()
    scannedRef.current = false
    setCameraState('starting')
    setError(null)
    setScanHint('Starting camera…')

    try {
      stopScanRef.current = await startBarcodeScan(videoRef.current, handleDetected)
      setCameraState('active')
      setScanHint('Scanning… hold the barcode steady inside the green box.')
    } catch (err) {
      stopCamera()
      setCameraState('error')
      setError(getCameraErrorMessage(err))
    }
  }, [cameraState, stopCamera, handleDetected])

  useEffect(() => {
    return () => {
      stopScanRef.current?.()
      stopScanRef.current = null
    }
  }, [])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = normalizeBarcode(manualBarcode)
    if (code) onManualEntry(code)
  }

  return (
    <div className="barcode-scanner">
      <h2 className="section-title">Scan Barcode</h2>
      <p className="section-subtitle">Point your camera at a product barcode (UPC/EAN)</p>

      <div className="scanner-viewport">
        <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
        {cameraState === 'active' && <div className="scanner-overlay" />}
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
        <button type="button" className="btn btn--secondary btn--full scanner-stop-btn" onClick={stopCamera}>
          Stop Camera
        </button>
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
