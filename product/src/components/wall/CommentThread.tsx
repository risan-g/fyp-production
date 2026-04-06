"use client";

import CommentNode from "./CommentNode";

interface CommentThreadProps {
  comments: any[];
  spotifyArtistId: string;
}

/**
 * Converts a flat array of comments from Supabase into a nested tree, using a highly efficient O(n) algorithm using a Map for lookups.
 */
function buildCommentTree(flatComments: any[]) {
  const commentMap = new Map();
  const tree: any[] = [];

  // Initialise the map with copies of the comments and empty children arrays
  flatComments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, children: [] });
  });

  // Distribute comments into their parents' children arrays, or the root tree
  flatComments.forEach(comment => {
    const node = commentMap.get(comment.id);
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id).children.push(node);
    } else {
      tree.push(node);
    }
  });

  return tree.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * transforms data into a tree.
 */
export default function CommentThread({ comments, spotifyArtistId }: CommentThreadProps) {
  const tree = buildCommentTree(comments);

  if (tree.length === 0) {
    return (
      <div className="mt-12 py-12 border-t-[2px] border-black border-dashed text-center">
        <span className="text-black/30 font-mono text-[10px] font-bold uppercase tracking-[0.2em]">NO DISCUSSION YET.</span>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-2 h-2 bg-black"></div>
        <h3 className="font-mono font-bold text-xs uppercase tracking-[0.3em] text-black">
          "THE CONVERSATION" ({comments.length} NOISES)
        </h3>
      </div>

      <div className="flex flex-col">
        {tree.map(node => (
          <CommentNode
            key={node.id}
            comment={node}
            spotifyArtistId={spotifyArtistId}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
