import { render, screen, waitFor } from '@testing-library/react';
import ReviewForm from '@/components/ReviewForm';
import { createClient } from '@/lib/supabase/client';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/app/actions/reviews', () => ({
  saveReview: jest.fn(),
  removeReview: jest.fn(),
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

describe('ReviewForm Component', () => {
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

  it('loads existing review text for Album A, resets for Album B', async () => {
    // Setup mock to return text for Album A
    mockSupabase.single.mockImplementationOnce(() => Promise.resolve({ data: { content: 'Great album!' } }));

    const { rerender } = render(
      <ReviewForm albumId="albumA" albumName="A" artistName="A" albumImage="A.jpg" />
    );

    // Wait for text to display
    await waitFor(() => {
      expect(screen.getByDisplayValue('Great album!')).toBeInTheDocument();
    });

    // Re-render with Album B, mock returns no review
    mockSupabase.single.mockImplementationOnce(() => Promise.resolve({ data: null }));
    rerender(<ReviewForm albumId="albumB" albumName="B" artistName="B" albumImage="B.jpg" />);

    // Should explicitly reset text area
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Great album!')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Share your thoughts...')).toHaveValue('');
    });
  });
});
