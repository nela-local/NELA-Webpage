import { NextResponse } from "next/server";

/**
 * Resolve a short-lived download URL for a GitHub Release asset.
 * Private repos cannot use browser_download_url anonymously; the Assets API
 * returns a 302 to a temporary signed URL that the browser can fetch directly.
 */
export async function resolveGithubReleaseAssetRedirect(
  assetId: number,
): Promise<string | null> {
  const repo =
    process.env.GITHUB_RELEASES_REPO?.trim() || "nela-local/nela-private";
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return null;

  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/assets/${assetId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/octet-stream",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "NELA-Webpage",
      },
      redirect: "manual",
    },
  );

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    return location && location.length > 0 ? location : null;
  }

  if (res.ok && res.url && !res.url.includes("/releases/assets/")) {
    return res.url;
  }

  console.error(
    `[github-release-download] asset ${assetId} failed: status=${res.status}`,
  );
  return null;
}

export async function redirectToReleaseAsset(input: {
  githubAssetId?: number;
  fallbackDownloadUrl: string;
}): Promise<NextResponse> {
  if (input.githubAssetId) {
    const signed = await resolveGithubReleaseAssetRedirect(input.githubAssetId);
    if (signed) {
      const response = NextResponse.redirect(signed, 302);
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }
  }

  const response = NextResponse.redirect(input.fallbackDownloadUrl, 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
