import { removeRating, removeReview } from '@/app/actions/reviews';
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
  update: jest.Mock;
  delete: jest.Mock;
}

describe('reviews actions', () => {
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
      single: jest.fn(),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }),
    };

    (createClient as unknown as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('removeRating keeps an existing review intact', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { content: 'hello' } });

    await removeRating('album1');

    expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ rating: null }));
    expect(mockSupabase.delete).not.toHaveBeenCalled();
  });

  it('removeReview keeps an existing rating intact', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { rating: 80 } });

    await removeReview('album1');

    expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ content: null }));
    expect(mockSupabase.delete).not.toHaveBeenCalled();
  });
});
