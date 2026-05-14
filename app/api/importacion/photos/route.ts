import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dir = path.resolve(process.cwd(), "public/photos/importacion-plantas");
    if (!fs.existsSync(dir)) {
      return NextResponse.json({ gambas: [], bucephalandras: [], terrario: [] });
    }
    
    const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
    
    // Categorize photos
    const gambas: string[] = [];
    const bucephalandras: string[] = [];
    const terrario: string[] = [];
    
    for (const f of files) {
      const url = `/photos/importacion-plantas/${f}`;
      const base = f.toLowerCase();
      
      if (base.includes("whatsapp")) {
        terrario.push(url);
      } else if (/^\d+\.(jpeg|jpg|png|webp)$/.test(f)) {
        // numbered files (1.jpeg, 2.jpeg, etc)
        bucephalandras.push(url);
      } else {
        // everything else is gambas (BKK, blue velvet, green jade, etc)
        gambas.push(url);
      }
    }
    
    // Sort for consistent order
    gambas.sort();
    bucephalandras.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });
    terrario.sort();
    
    return NextResponse.json({ gambas, bucephalandras, terrario });
  } catch (err) {
    return NextResponse.json({ gambas: [], bucephalandras: [], terrario: [] });
  }
}
