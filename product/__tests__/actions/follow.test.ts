import { toggleFollow } from '@/app/actions/follow';
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
  rpc: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
}

describe('follow actions', () => {
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
      single: jest.fn().mockResolvedValue({ data: { is_private: false } }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      rpc: jest.fn().mockResolvedValue({ error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnThis(),
    };

    (createClient as unknown as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('produces a pending request if target is private', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    mockSupabase.single.mockResolvedValueOnce({ data: { is_private: true } });
    mockSupabase.insert.mockResolvedValueOnce({ error: null });

    await toggleFollow('123e4567-e89b-12d3-a456-426614174000');
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      follower_id: 'user1',
      following_id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'pending'
    });
  });

  it('produces an active follow if target is public', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    mockSupabase.single.mockResolvedValueOnce({ data: { is_private: false } });
    mockSupabase.insert.mockResolvedValueOnce({ error: null });

    await toggleFollow('123e4567-e89b-12d3-a456-426614174000');
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      follower_id: 'user1',
      following_id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'accepted'
    });
  });
});
