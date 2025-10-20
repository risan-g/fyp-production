import Link from "next/link";

interface ArtistLinkProps {
  artists: { id: string; name: string }[];
  className?: string;
}

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
          {i < artists.length - 1 ? ", " : ""}
        </span>
      ))}
    </>
  );
}
