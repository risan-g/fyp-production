import { updateAvatarPath } from '@/app/actions/settings';
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

const TEST_UID = '123e4567-e89b-12d3-a456-426614174000';

interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  update: jest.Mock;
  storage: {
    from: jest.Mock;
  };
}

describe('settings actions', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: TEST_UID } }, error: null }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { avatar_url: null } }),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      storage: {
        from: jest.fn().mockReturnValue({
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'mockedUrl' } }),
        })
      }
    };

    (createClient as unknown as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('accepts valid owned paths with allowed extensions (.png, .jpg, .jpeg, .webp)', async () => {
    for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
      const res = await updateAvatarPath(`${TEST_UID}-123456789.${ext}`);
      expect(res?.error).toBeUndefined();
    }
    expect(mockSupabase.update).toHaveBeenCalledWith({ avatar_url: 'mockedUrl' });
  });

  it('rejects wrong user prefix', async () => {
    const res = await updateAvatarPath('999e4567-e89b-12d3-a456-426614174999-123456789.png');
    expect(res?.error).toBe('Unauthorized path prefix.');
    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

  it('rejects disallowed or missing extensions (.gif, .svg, extensionless)', async () => {
    const badPaths = [
      `${TEST_UID}-123456789.gif`,
      `${TEST_UID}-123456789.svg`,
      `${TEST_UID}-123456789`,
    ];

    for (const path of badPaths) {
      const res = await updateAvatarPath(path);
      expect(res?.error).toBeDefined();
    }
  });

  it('rejects traversal-style, nested folder, and non-numeric timestamp paths', async () => {
    const maliciousPaths = [
      `${TEST_UID}-../malicious.jpg`,
      `${TEST_UID}/nested/123456789.jpg`,
      `${TEST_UID}-nonnumeric.jpg`,
    ];

    for (const path of maliciousPaths) {
      const res = await updateAvatarPath(path);
      expect(res?.error).toBeDefined();
    }
  });
});
