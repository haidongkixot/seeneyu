import { prisma } from '@/lib/prisma'

export interface CloudStorageProvider {
  upload(buffer: Buffer, filename: string, mimeType: string): Promise<string>
  isConfigured(): Promise<boolean>
}

export async function getEnabledStorageProviders(): Promise<Array<{ provider: string; config: any }>> {
  const configs = await prisma.cloudStorageConfig.findMany({
    where: { isEnabled: true },
  })
  return configs.map(c => ({ provider: c.provider, config: c.config }))
}

export async function uploadToCloudStorage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<Record<string, string>> {
  const providers = await getEnabledStorageProviders()
  const results: Record<string, string> = {}

  for (const { provider, config } of providers) {
    try {
      switch (provider) {
        case 'google_drive': {
          // Google Drive upload via googleapis
          // Requires: config.accessToken, config.refreshToken, config.folderId
          // Implementation deferred — requires googleapis npm package
          console.log(`[Storage] Google Drive upload skipped — not yet implemented`)
          break
        }
        case 'onedrive': {
          // OneDrive upload via MS Graph
          // Requires: config.accessToken, config.refreshToken, config.folderPath
          // Implementation deferred — requires MS Graph API calls
          console.log(`[Storage] OneDrive upload skipped — not yet implemented`)
          break
        }
        default:
          console.log(`[Storage] Unknown provider: ${provider}`)
      }
    } catch (error) {
      console.error(`[Storage] Failed to upload to ${provider}:`, error)
    }
  }

  return results
}
