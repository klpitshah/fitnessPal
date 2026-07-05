import type { ScannedProduct } from '../types'
import { normalizeBarcode } from '../utils/barcodeEngine'

interface OFFResponse {
  status: number
  product?: {
    product_name?: string
    brands?: string
    serving_size?: string
    nutriments?: {
      'energy-kcal_100g'?: number
      proteins_100g?: number
      carbohydrates_100g?: number
      fat_100g?: number
      sugars_100g?: number
    }
  }
}

function parseServingGrams(servingSize?: string): number | undefined {
  if (!servingSize) return undefined
  const match = servingSize.match(/([\d.]+)\s*g/i)
  if (match) return parseFloat(match[1])
  return undefined
}

export async function lookupBarcode(barcode: string): Promise<ScannedProduct> {
  const code = normalizeBarcode(barcode)
  if (!code) throw new Error('Invalid barcode')

  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,serving_size,nutriments`,
  )

  if (!res.ok) throw new Error('Failed to look up product')

  const data: OFFResponse = await res.json()
  if (data.status !== 1 || !data.product) {
    throw new Error('Product not found in database')
  }

  const { product } = data
  const n = product.nutriments ?? {}

  const calories = n['energy-kcal_100g'] ?? 0
  const protein = n.proteins_100g ?? 0
  const carbs = n.carbohydrates_100g ?? 0
  const fat = n.fat_100g ?? 0
  const sugar = n.sugars_100g ?? 0

  if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
    throw new Error('No nutrition data available for this product')
  }

  const servingSizeGrams = parseServingGrams(product.serving_size)

  return {
    barcode: code,
    name: product.product_name ?? 'Unknown Product',
    brand: product.brands?.split(',')[0]?.trim(),
    per100g: { calories, protein, carbs, fat, sugar },
    servingSizeGrams,
    servingDescription: product.serving_size,
  }
}
