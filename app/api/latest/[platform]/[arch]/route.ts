import { NextResponse } from 'next/server';
import { track } from '@vercel/analytics/server';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';
import { getReleasesServerSide, type AssetType, type ReleaseAsset } from '@/lib/releases';
import { redirectToReleaseAsset } from '@/lib/github-release-download';

type CanonicalPlatform = 'Windows' | 'Linux' | 'macOS';
type CanonicalArch = 'amd64' | 'arm64';

const PLATFORM_ALIASES: Record<string, CanonicalPlatform> = {
  windows: 'Windows',
  win: 'Windows',
  linux: 'Linux',
  macos: 'macOS',
  mac: 'macOS',
  darwin: 'macOS',
};

const ARCH_ALIASES: Record<string, CanonicalArch> = {
  amd64: 'amd64',
  x86_64: 'amd64',
  x64: 'amd64',
  arm64: 'arm64',
  aarch64: 'arm64',
};

const ARCH_PATTERNS: Record<CanonicalArch, RegExp[]> = {
  amd64: [/\bamd64\b/i, /\bx86_64\b/i, /\bx64\b/i, /\bintel\b/i],
  arm64: [/\barm64\b/i, /\baarch64\b/i, /apple[\s_-]?silicon/i],
};

const TYPE_PREFERENCE: Record<CanonicalPlatform, AssetType[]> = {
  Windows: ['exe', 'msi', 'archive'],
  Linux: ['deb', 'AppImage', 'archive'],
  macOS: ['dmg', 'archive'],
};

function normalizePlatform(input: string): CanonicalPlatform | null {
  return PLATFORM_ALIASES[input.toLowerCase()] ?? null;
}

function normalizeArch(input: string): CanonicalArch | null {
  return ARCH_ALIASES[input.toLowerCase()] ?? null;
}

function matchesRequestedArch(assetName: string, arch: CanonicalArch): boolean {
  return ARCH_PATTERNS[arch].some((pattern) => pattern.test(assetName));
}

function hasExplicitArchMarker(assetName: string): boolean {
  return Object.values(ARCH_PATTERNS).some((patterns) =>
    patterns.some((pattern) => pattern.test(assetName))
  );
}

function pickPreferredAsset(
  assets: ReleaseAsset[],
  platform: CanonicalPlatform,
  arch: CanonicalArch
): ReleaseAsset | null {
  if (assets.length === 0) return null;

  const hasArchSpecificAssets = assets.some((asset) => hasExplicitArchMarker(asset.name));
  const pool = hasArchSpecificAssets
    ? assets.filter((asset) => matchesRequestedArch(asset.name, arch))
    : assets;

  if (pool.length === 0) return null;

  const preferredTypes = TYPE_PREFERENCE[platform];
  const ranked = [...pool].sort((a, b) => {
    const rankA = preferredTypes.indexOf(a.type);
    const rankB = preferredTypes.indexOf(b.type);
    const normalizedA = rankA === -1 ? preferredTypes.length : rankA;
    const normalizedB = rankB === -1 ? preferredTypes.length : rankB;

    if (normalizedA !== normalizedB) return normalizedA - normalizedB;
    return a.name.localeCompare(b.name);
  });

  return ranked[0] ?? null;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ platform: string; arch: string }> }
): Promise<Response> {
  const { platform: rawPlatform, arch: rawArch } = await context.params;

  const platform = normalizePlatform(rawPlatform);
  if (!platform) {
    return NextResponse.json({ error: `Unsupported platform: ${rawPlatform}` }, { status: 400 });
  }

  const arch = normalizeArch(rawArch);
  if (!arch) {
    return NextResponse.json({ error: `Unsupported architecture: ${rawArch}` }, { status: 400 });
  }

  try {
    const releases = await getReleasesServerSide();
    if (!releases.latestVersion) {
      return NextResponse.json({ error: 'No releases available' }, { status: 404 });
    }

    const latestVersionData = releases.versions.find((v) => v.version === releases.latestVersion);
    if (!latestVersionData) {
      return NextResponse.json({ error: 'Latest release metadata missing' }, { status: 404 });
    }

    const platformAssets = latestVersionData.platforms[platform] ?? [];
    const asset = pickPreferredAsset(platformAssets, platform, arch);

    if (!asset) {
      return NextResponse.json({
        error: `No matching asset for ${platform} (${arch}) in ${latestVersionData.version}`,
      }, { status: 404 });
    }

    void track(ANALYTICS_EVENTS.DownloadServed, {
      source: 'latest_api',
      route: '/api/latest/:platform/:arch',
      version: latestVersionData.version,
      platform,
      arch,
      asset_name: asset.name,
      asset_type: asset.type,
      asset_size_bytes: asset.size,
    }).catch(() => undefined);

    return redirectToReleaseAsset({
      githubAssetId: asset.github_asset_id,
      fallbackDownloadUrl: asset.download_url,
    });
  } catch (error) {
    console.error('Latest installer resolution error:', error);
    return NextResponse.json({ error: 'Unable to resolve latest installer' }, { status: 500 });
  }
}
