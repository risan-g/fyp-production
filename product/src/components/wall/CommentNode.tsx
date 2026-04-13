"use client";

import { useState } from "react";
import DBControl from "./DBControl";
import { createComment, voidComment } from "@/app/actions/wall";
import ConfirmModal from "@/components/ConfirmModal";
import FormattedText from "./FormattedText";

interface CommentNodeProps {
  comment: any;
  spotifyArtistId: string;
  currentUserId?: string;
  depth?: number;
}

/**
 * RECURSIVE COMMENT COMPONENT
 */
export default function CommentNode({ comment, spotifyArtistId, currentUserId, depth = 0 }: CommentNodeProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment(comment.post_id, comment.id, replyContent, spotifyArtistId);
      setReplyContent("");
      setIsReplying(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Limit indenting after level.
  const maxVisualDepth = 8;
  const showIndent = depth < maxVisualDepth;

  return (
    <div className={`flex flex-col mt-6 ${showIndent && depth > 0 ? "ml-4 md:ml-8 border-l-[4px] border-black pl-4 md:pl-6" : ""}`}>

      {/* The Comment Box */}
      <div className="flex gap-4 group">

        {/* dB Control for Comment */}
        <div className="shrink-0">
          <DBControl
            entityId={comment.id}
            entityType="comment"
            initialScore={comment.score || 0}
            initialUserVote={comment.userVote || 0}
            spotifyArtistId={spotifyArtistId}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-black/40 mb-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hover:text-black transition-all hover:bg-black/10 px-1"
            >
              {isCollapsed ? "[+]" : "[-]"}
            </button>
            <div className="w-5 h-5 bg-white border-[2px] border-black flex items-center justify-center overflow-hidden shrink-0">
              {comment.profiles?.avatar_url ? (
                <img
                  src={comment.profiles.avatar_url}
                  alt={comment.profiles.username}
                  className="w-full h-full object-cover grayscale"
                />
              ) : (
                <span className="text-[8px] font-bold text-black">
                  {comment.profiles?.username?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <span className="text-black">{comment.profiles?.username || "UNKNOWN"}</span>
            <span>•</span>
            <span suppressHydrationWarning>{new Date(comment.created_at).toLocaleDateString()}</span>
          </div>

          {isCollapsed ? (
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black/40 italic py-2 cursor-pointer" onClick={() => setIsCollapsed(false)}>
              [ THREAD COLLAPSED ]
            </div>
          ) : (
            <>
              {/* Content */}
              <div className={`font-serif text-base leading-relaxed p-3 border-[2px] border-black bg-neutral-50 shadow-[2px_2px_0px_rgba(0,0,0,1)] ${comment.is_voided ? "italic text-black/40 bg-neutral-100 border-dashed" : "text-black"}`}>
                <FormattedText text={comment.content} />
              </div>

              {/* Actions */}
              {!comment.is_voided && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] border-b-[2px] border-transparent hover:border-black transition-all"
                  >
                    {isReplying ? "[ CLOSE ]" : "[ REPLY ]"}
                  </button>

                  {currentUserId === comment.user_id && (
                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={isVoiding}
                      className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-accent-red border-b-[2px] border-transparent hover:border-accent-red transition-all disabled:opacity-50"
                    >
                      {isVoiding ? "VOIDING..." : "[ DELETE ]"}
                    </button>
                  )}
                </div>
              )}

              {showConfirm && (
                <ConfirmModal
                  message="VOID THIS COMMENT?"
                  onConfirm={async () => {
                    setShowConfirm(false);
                    setIsVoiding(true);
                    try {
                      await voidComment(comment.id, spotifyArtistId);
                    } catch (err: any) {
                      alert(err.message || "Failed to void comment.");
                    } finally {
                      setIsVoiding(false);
                    }
                  }}
                  onCancel={() => setShowConfirm(false)}
                />
              )}

              {/* Reply Form */}
              {isReplying && (
                <div className="mt-4 flex flex-col gap-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="REPLY..."
                    className="w-full bg-white border-[3px] border-black p-4 font-serif text-sm focus:outline-none min-h-[80px] placeholder:text-black/20 placeholder:uppercase"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleReply}
                      disabled={isSubmitting || !replyContent.trim()}
                      className="bg-black text-white text-[9px] font-mono font-bold py-2 px-4 border-[2px] border-black hover:bg-accent-red transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? "SENDING..." : "REPLY"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* THE RECURSION */}
      {!isCollapsed && comment.children && comment.children.length > 0 && (
        <div className="flex flex-col">
          {comment.children.map((child: any) => (
          <CommentNode
              key={child.id}
              comment={child}
              spotifyArtistId={spotifyArtistId}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
