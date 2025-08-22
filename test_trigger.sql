-- Test if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_story_vote_counts';

-- Test if the function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'update_story_vote_counts';

-- Check current vote counts for a specific story
SELECT 
    id,
    title,
    like_count,
    dislike_count
FROM stories 
WHERE id = '6fa65e4c-2e63-4fe0-9a19-b190d57a9566';

-- Check votes for this story
SELECT 
    story_id,
    user_id,
    vote_type,
    created_at
FROM story_votes 
WHERE story_id = '6fa65e4c-2e63-4fe0-9a19-b190d57a9566';

-- Manually test the trigger function
SELECT update_story_vote_counts();
