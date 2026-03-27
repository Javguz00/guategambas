import { NextResponse } from "next/server";
import { speciesCatalog, packs } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ species: speciesCatalog, packs });
}
