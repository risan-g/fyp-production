import Link from "next/link";

interface ArtistLinkProps {
  // We expect an array because a track might have multiple artists (e.g., a feature).
  artists: { id: string; name: string }[];
  className?: string;
}

/**
 * Artist Link Component.
 *
 * This is a reusable utility to display a list of artist names.
 * Instead of just showing text, it links each name to that artist's profile page.
 *
 * It also handles the grammar logic: if there are multiple artists,
 * it adds a comma between them, but ensures there is no comma after the last one.
 */
export default function ArtistLink({ artists, className }: ArtistLinkProps) {
  return (
    <>
      {artists.map((a, i) => (
        <span key={a.id}>
          <Link
            href={`/artist/${a.id}`}
            className={`hover:underline ${className || ""}`}
          >
            {a.name}
          </Link>
          {/* Add a comma only if this is NOT the last artist in the list */}
          {i < artists.length - 1 ? ", " : ""}
        </span>
      ))}
    </>
  );
}
