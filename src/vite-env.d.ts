/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface BarcodeDetectorOptions {
  formats?: string[]
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  static getSupportedFormats(): Promise<string[]>
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>
}
