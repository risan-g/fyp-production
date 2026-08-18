import { toggleVote } from '@/app/actions/wall';
import { createClient } from '@/lib/supabase/server';

jest.mock('next/headers', () => ({
  cookies: () => ({ getAll: jest.fn(), set: jest.fn() }),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  insert: jest.Mock;
  rpc: jest.Mock;
}

describe('wall actions', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user1' } }, error: null }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { vote_type: null } }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      rpc: jest.fn().mockResolvedValue({ error: null }),
    };

    (createClient as unknown as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('accepts valid votes 1 and -1', async () => {
    // toggleVote(entityId, entityType, voteValue, spotifyArtistId)
    const res1 = await toggleVote('123e4567-e89b-12d3-a456-426614174000', 'post', 1, 'artistId');
    expect(res1?.error).toBeUndefined();

    const res2 = await toggleVote('123e4567-e89b-12d3-a456-426614174000', 'post', -1, 'artistId');
    expect(res2?.error).toBeUndefined();
  });

  it('rejects invalid vote integers', async () => {
    await expect(toggleVote('123e4567-e89b-12d3-a456-426614174000', 'post', 2, 'artistId')).rejects.toThrow();
  });
});
