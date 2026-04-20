import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// ─── Storage Bucket Setup ─────────────────────────────────────────────────

const BUCKET_NAME = 'company-logos'

/** Ensure the storage bucket exists and is public */
async function ensureBucket() {
  const supabase = createServiceClient()

  // Try to get the bucket first
  const { data: bucket } = await supabase.storage.getBucket(BUCKET_NAME)

  if (bucket) return

  // Create the bucket with public access
  const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  })

  if (error) {
    logger.error('Failed to create storage bucket', { error: error.message })
    throw new Error('Failed to create storage bucket')
  }

  logger.info('Created company-logos storage bucket')
}

// ─── POST: Upload Logo ────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`logo_upload:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, logo_url')
      .eq('id', id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Accepted: PNG, JPEG, WebP, SVG',
      }, { status: 400 })
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
      }, { status: 400 })
    }

    // Ensure storage bucket exists
    await ensureBucket()

    // Determine file extension
    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    }
    const ext = extMap[file.type] || 'png'

    // Build file path: {company_id}/{timestamp}.{ext}
    const timestamp = Date.now()
    const filePath = `${id}/${timestamp}.${ext}`

    // Delete old logo if it exists
    if (company.logo_url) {
      try {
        // Extract path from URL: https://.../storage/v1/object/public/bucket-name/path
        const url = new URL(company.logo_url)
        const pathParts = url.pathname.split('/public/')
        if (pathParts.length === 2) {
          const oldPath = pathParts[1]
          await supabase.storage.from(BUCKET_NAME).remove([oldPath])
        }
      } catch {
        // Ignore errors when removing old file — the new one will still work
        logger.warn('Could not remove old logo file', { companyId: id })
      }
    }

    // Upload new file
    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      })

    if (uploadError) {
      logger.error('Failed to upload logo', { error: uploadError.message, companyId: id })
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update company's logo_url
    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: publicUrl })
      .eq('id', id)

    if (updateError) {
      logger.error('Failed to update company logo_url', { error: updateError.message, companyId: id })
      // Clean up uploaded file since DB update failed
      await supabase.storage.from(BUCKET_NAME).remove([filePath])
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }

    return NextResponse.json({
      logoUrl: publicUrl,
    })
  } catch (error) {
    logger.error('Logo upload error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE: Remove Logo ──────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`logo_delete:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get current logo URL
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, logo_url')
      .eq('id', id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Delete from storage if URL exists
    if (company.logo_url) {
      try {
        const url = new URL(company.logo_url)
        const pathParts = url.pathname.split('/public/')
        if (pathParts.length === 2) {
          const filePath = pathParts[1]
          await supabase.storage.from(BUCKET_NAME).remove([filePath])
        }
      } catch {
        logger.warn('Could not remove logo from storage', { companyId: id })
      }
    }

    // Null out logo_url in database
    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: null })
      .eq('id', id)

    if (updateError) {
      logger.error('Failed to clear logo_url', { error: updateError.message, companyId: id })
      return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Logo delete error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
