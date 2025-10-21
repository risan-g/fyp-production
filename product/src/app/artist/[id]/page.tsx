import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSpotifyData } from "@/lib/spotify";
import DiscographySection from "@/components/DiscographySection";

async function fetchAllArtistAlbums(artistId: string) {
  let allAlbums: any[] = [];
  let nextUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation&limit=50`;

  while (nextUrl) {
    const data = await fetchSpotifyData(nextUrl);
    allAlbums = allAlbums.concat(data.items);
    nextUrl = data.next;
  }

  return allAlbums;
}

async function fetchArtist(artistId: string) {
  return await fetchSpotifyData(
    `https://api.spotify.com/v1/artists/${artistId}`
  );
}

export default async function ArtistPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const [artist, albums] = await Promise.all([
    fetchArtist(id),
    fetchAllArtistAlbums(id),
  ]);

  if (!artist || !albums) notFound();

  const uniqueAlbums = Array.from(
    new Map(albums.map((a) => [a.id, a])).values()
  );

  const epFilter = (album: any) =>
    album.album_type === "single" &&
    album.total_tracks > 3 &&
    album.total_tracks <= 7;

  const singleFilter = (album: any) => album.album_type === "single";

  const albumsGroup = {
    album: uniqueAlbums.filter((a) => a.album_type === "album"),
    ep: uniqueAlbums.filter(epFilter),
    single: uniqueAlbums.filter(singleFilter),
    compilation: uniqueAlbums.filter((a) => a.album_type === "compilation"),
  };

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{artist.name}</h1>
      <DiscographySection title="Albums" items={albumsGroup.album} />
      <DiscographySection title="EPs" items={albumsGroup.ep} />
      <DiscographySection title="Singles" items={albumsGroup.single} />
      <DiscographySection
        title="Compilations"
        items={albumsGroup.compilation}
      />
    </div>
  );
}
