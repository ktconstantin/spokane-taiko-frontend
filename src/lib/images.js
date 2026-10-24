// Loads an image from a URL and returns a JPEG copy no wider/taller than `maxSize`.
// Used so the homepage doesn't load multi-megabyte phone photos.
export async function resizeImageFromUrl(url, { maxSize = 2000, quality = 0.85 } = {}) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not download image (${response.status})`)

  const original = await response.blob()
  const bitmap = await createImageBitmap(original)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const resized = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not resize image'))),
      'image/jpeg',
      quality,
    ),
  )

  // Keep whichever is smaller (an already-small original can beat the re-encode)
  return resized.size < original.size ? resized : original
}
