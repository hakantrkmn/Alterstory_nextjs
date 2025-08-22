import mitt from "mitt"

type Events = {
  voteUpdate: { story_id: string; like_count: number; dislike_count: number }
  commentUpdate: { story_id: string; commentId: string; type: "add" | "edit" | "delete" }
  commentCountUpdate: { story_id: string; comment_count: number }
  newComment: { story_id: string; commentId: string }
  commentDelete: { story_id: string; comment_id: string }
  voteChange: { story_id: string; user_id: string; vote_type: 'like' | 'dislike' | null }
}

export const eventBus = mitt<Events>()