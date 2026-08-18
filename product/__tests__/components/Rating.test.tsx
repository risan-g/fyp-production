import { render, screen, waitFor } from '@testing-library/react';
import Rating from '@/components/Rating';
import { createClient } from '@/lib/supabase/client';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/app/actions/reviews', () => ({
  saveRating: jest.fn(),
  removeRating: jest.fn(),
}));

interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
}

describe('Rating Component', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as unknown as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('loads existing rating for Album A, resets for Album B, restores for Album A', async () => {
    // Setup mock to return rating 85 for Album A
    mockSupabase.single.mockImplementationOnce(() => Promise.resolve({ data: { rating: 85 } }));

    const { rerender } = render(
      <Rating albumId="albumA" albumName="A" artistName="A" albumImage="A.jpg" />
    );

    // Wait for loading to finish and 85 to display
    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    // Re-render with Album B, mock returns no rating
    mockSupabase.single.mockImplementationOnce(() => Promise.resolve({ data: null }));
    rerender(<Rating albumId="albumB" albumName="B" artistName="B" albumImage="B.jpg" />);

    // Should explicitly reset to 0
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('(NOT GOOD)')).toBeInTheDocument();
    });

    // Re-render with Album A, mock returns 85 again
    mockSupabase.single.mockImplementationOnce(() => Promise.resolve({ data: { rating: 85 } }));
    rerender(<Rating albumId="albumA" albumName="A" artistName="A" albumImage="A.jpg" />);

    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });
});
