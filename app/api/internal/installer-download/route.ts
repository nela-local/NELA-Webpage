import { NextRequest, NextResponse } from 'next/server';
import { track } from '@vercel/analytics/server';
import { getReleasesServerSide } from '@/lib/releases';
import { redirectToReleaseAsset } from '@/lib/github-release-download';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const version = req.nextUrl.searchParams.get('version');
  const platform = req.nextUrl.searchParams.get('platform');
  const assetName = req.nextUrl.searchParams.get('asset');
  const source = req.nextUrl.searchParams.get('source') ?? 'unknown';

  if (!version) return badRequest('Missing version');
  if (!platform) return badRequest('Missing platform');
  if (!assetName) return badRequest('Missing asset');

  try {
    const releases = await getReleasesServerSide();
    const selectedVersion = releases.versions.find((v) => v.version === version);

    if (!selectedVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const platformAssets = selectedVersion.platforms[platform] ?? [];
    const matchedAsset = platformAssets.find((a) => a.name === assetName);

    if (!matchedAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    void track(ANALYTICS_EVENTS.DownloadServed, {
      source,
      route: '/api/internal/installer-download',
      version,
      platform,
      asset_name: matchedAsset.name,
      asset_type: matchedAsset.type,
      asset_size_bytes: matchedAsset.size,
    }).catch(() => undefined);

    return redirectToReleaseAsset({
      githubAssetId: matchedAsset.github_asset_id,
      fallbackDownloadUrl: matchedAsset.download_url,
    });
  } catch (error) {
    console.error('Installer download proxy error:', error);
    return NextResponse.json({ error: 'Unable to process installer download' }, { status: 500 });
  }
}
