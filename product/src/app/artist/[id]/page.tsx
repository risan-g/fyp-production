import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSpotifyData } from "@/lib/spotify";

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
    new Map(albums.map((a) => [a.name.toLowerCase(), a])).values()
  );

  const albumsGroup = {
    album: uniqueAlbums.filter((a) => a.album_type === "album"),
    single: uniqueAlbums.filter((a) => a.album_type === "single"),
    compilation: uniqueAlbums.filter((a) => a.album_type === "compilation"),
  };

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{artist.name}</h1>

      {Object.entries(albumsGroup).map(([groupName, items]) => (
        <div key={groupName} className="mb-8">
          <h2 className="text-xl mb-3 capitalize">
            {groupName.replace("_", " ")}
          </h2>
          {items.length === 0 ? (
            <p className="text-gray-400">No {groupName} found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((album: any) => (
                <Link
                  key={album.id}
                  href={`/album/${album.id}`}
                  className="bg-purple-900 rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition-transform"
                >
                  {album.images[0] && (
                    <img
                      src={album.images[0].url}
                      alt={album.name}
                      className="aspect-square w-full object-cover rounded-5xl"
                    />
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{album.name}</p>
                    <p className="text-xs text-gray-400">
                      {album.release_date}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
