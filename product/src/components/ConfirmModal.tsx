"use client";

/**
 * A reusable Brutalist confirmation modal.
 * Replaces the ugly native window.confirm() with a styled inline dialog.
 */
export default function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 max-w-sm w-full flex flex-col gap-6">
        <p className="font-mono font-bold text-sm uppercase tracking-[0.1em] text-black text-center">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_rgba(255,0,0,1)] hover:bg-accent-red hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
