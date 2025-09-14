import sharp from 'sharp'
import { supabaseAdmin } from './supabase'

export interface ImageUploadResult {
  imageUrl: string
  thumbnailUrl: string
  watermarkedUrl?: string
}

export async function uploadImage(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<ImageUploadResult> {
  const bucketName = process.env.SUPABASE_BUCKET_NAME || 'punch-submissions'
  
  // 元画像をアップロード
  const imagePath = `submissions/${userId}/${fileName}`
  const { data: imageData, error: imageError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(imagePath, file, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (imageError) {
    throw new Error(`画像アップロードエラー: ${imageError.message}`)
  }

  // サムネイル画像を作成（150x150）
  const thumbnailBuffer = await sharp(file)
    .resize(150, 150, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer()

  const thumbnailPath = `thumbnails/${userId}/${fileName}`
  const { data: thumbnailData, error: thumbnailError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(thumbnailPath, thumbnailBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (thumbnailError) {
    throw new Error(`サムネイルアップロードエラー: ${thumbnailError.message}`)
  }

  // 透かし入り画像を作成
  const watermarkedBuffer = await createWatermarkedImage(file)
  const watermarkedPath = `watermarked/${userId}/${fileName}`
  const { data: watermarkedData, error: watermarkedError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(watermarkedPath, watermarkedBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (watermarkedError) {
    throw new Error(`透かし画像アップロードエラー: ${watermarkedError.message}`)
  }

  // 公開URLを取得
  const { data: imageUrlData } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(imagePath)

  const { data: thumbnailUrlData } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(thumbnailPath)

  const { data: watermarkedUrlData } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(watermarkedPath)

  return {
    imageUrl: imageUrlData.publicUrl,
    thumbnailUrl: thumbnailUrlData.publicUrl,
    watermarkedUrl: watermarkedUrlData.publicUrl
  }
}

async function createWatermarkedImage(file: Buffer): Promise<Buffer> {
  const watermarkText = '世界一速いパンチ'
  
  // SVG透かしを作成
  const svgWatermark = `
    <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="35" font-family="Arial, sans-serif" font-size="20" 
            fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.5)" stroke-width="1">
        ${watermarkText}
      </text>
    </svg>
  `

  const watermarkBuffer = Buffer.from(svgWatermark)

  return await sharp(file)
    .composite([
      {
        input: watermarkBuffer,
        gravity: 'southeast',
        blend: 'over'
      }
    ])
    .jpeg({ quality: 90 })
    .toBuffer()
}

export function validateImage(file: Buffer, originalName: string): void {
  // ファイルサイズチェック（2MB）
  const maxSize = 2 * 1024 * 1024
  if (file.length > maxSize) {
    throw new Error('画像サイズは2MB以下にしてください')
  }

  // ファイル形式チェック
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.tiff']
  const extension = originalName.toLowerCase().substring(originalName.lastIndexOf('.'))
  if (!allowedExtensions.includes(extension)) {
    throw new Error('JPEG、PNG、TIFF形式のみ対応しています')
  }
}



