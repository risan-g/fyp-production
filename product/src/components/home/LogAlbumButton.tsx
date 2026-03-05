"use client";

export default function LogAlbumButton() {
    return (
        <button
            onClick={() => {
                const searchInput = document.querySelector(
                    'input[placeholder="Search artist, album, single..."]'
                ) as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            }}
            className="bg-accent-red text-white flex items-center gap-2 font-bold px-12 py-5 hover:bg-black transition-all active:scale-95 text-sm uppercase tracking-[0.2em] min-w-[200px] border-[3px] border-black font-mono shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px]"
        >
            LOG AN ALBUM
        </button>
    );
}
