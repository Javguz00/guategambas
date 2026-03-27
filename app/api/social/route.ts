import { NextResponse } from "next/server";
import { socialPosts, instagramProfile } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ profile: instagramProfile, posts: socialPosts });
}
