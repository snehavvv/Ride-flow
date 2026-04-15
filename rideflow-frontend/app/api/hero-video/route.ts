import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 86400; // Cache for 24 hours

const SEARCH_QUERIES = [
  "city commute driving",
  "motorcycle riding city",
  "cab taxi driving street",
  "urban traffic driving"
];

export async function GET() {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing Pexels API Key" }, { status: 500 });
  }

  try {
    for (const query of SEARCH_QUERIES) {
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=landscape&size=large&per_page=5`,
        {
          headers: {
            Authorization: apiKey
          },
          next: { revalidate: 86400 }
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      
      if (data.videos && data.videos.length > 0) {
        // Find a high quality video file
        const video = data.videos[0];
        const videoFile = video.video_files.find(
          (f: any) => f.quality === "hd" || f.width >= 1280
        ) || video.video_files[0];

        if (videoFile) {
          return NextResponse.json({ url: videoFile.link });
        }
      }
    }

    return NextResponse.json({ error: "No videos found" }, { status: 404 });
  } catch (error) {
    console.error("Pexels API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
