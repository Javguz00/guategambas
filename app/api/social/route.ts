import { NextResponse } from "next/server";
import { socialPosts, instagramProfile } from "@/lib/data";
import { SocialPost } from "@/lib/types";

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!token || !accountId) {
    return NextResponse.json({
      profile: instagramProfile,
      posts: socialPosts,
      source: "fallback"
    });
  }

  try {
    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "thumbnail_url",
      "permalink",
      "timestamp"
    ].join(",");

    const url = `https://graph.facebook.com/v19.0/${accountId}/media?fields=${fields}&access_token=${token}`;
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error("Graph API failed");

    const json = (await response.json()) as {
      data?: Array<{
        id: string;
        caption?: string;
        media_type?: string;
        media_url?: string;
        thumbnail_url?: string;
        permalink?: string;
        timestamp?: string;
      }>;
    };

    const posts: SocialPost[] = (json.data || []).slice(0, 9).map((item) => ({
      id: item.id,
      type: item.media_type === "VIDEO" || item.media_type === "REEL" ? "reel" : "post",
      title: item.caption?.slice(0, 80) || "Publicacion de Instagram",
      url: item.permalink || instagramProfile,
      thumbnailUrl: item.thumbnail_url || item.media_url,
      publishedAt: item.timestamp?.slice(0, 10) || new Date().toISOString().slice(0, 10)
    }));

    return NextResponse.json({ profile: instagramProfile, posts, source: "instagram-graph" });
  } catch {
    return NextResponse.json({
      profile: instagramProfile,
      posts: socialPosts,
      source: "fallback"
    });
  }
}
