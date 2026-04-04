/**
 * DepthBar Component Tests
 *
 * Tests the minimal, opinionated reading progress indicator.
 *
 * Test coverage:
 * - Renders only when scrolling begins
 * - Displays correct progress percentage
 * - Fades out when finished
 * - Accessibility attributes
 * - Responsive design classes
 */

import { render, screen, waitFor } from '@testing-library/react';
import { DepthBar } from '../DepthBar';

// Mock the useScrollDepth hook
jest.mock('@/lib/hooks/useScrollDepth', () => ({
  useScrollDepth: jest.fn(),
}));

import { useScrollDepth } from '@/lib/hooks/useScrollDepth';

describe('DepthBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when not reading', () => {
    (useScrollDepth as jest.Mock).mockReturnValue({
      depth: 0,
      isReading: false,
      isFinished: false,
    });

    const { container } = render(<DepthBar articleId="test-article" />);

    expect(container.firstChild).toBeNull();
  });

  it('should render when reading starts', () => {
    (useScrollDepth as jest.Mock).mockReturnValue({
      depth: 10,
      isReading: true,
      isFinished: false,
    });

    render(<DepthBar articleId="test-article" />);

    // Check for progress bar role
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-label', 'Reading progress: 10%');
    expect(progressBar).toHaveAttribute('aria-valuenow', '10');
  });

  it('should display percentage indicator when depth > 10%', () => {
    (useScrollDepth as jest.Mock).mockReturnValue({
      depth: 45,
      isReading: true,
      isFinished: false,
    });

    render(<DepthBar articleId="test-article" />);

    // Check for percentage text
    const percentage = screen.getByText('45%');
    expect(percentage).toBeInTheDocument();
  });

  it('should not display percentage indicator when depth <= 10%', () => {
    (useScrollDepth as jest.Mock).mockReturnValue({
      depth: 5,
      isReading: true,
      isFinished: false,
    });

    render(<DepthBar articleId="test-article" />);

    // Should not show percentage at low depths
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });

  it('should fade out when finished', async () => {
    (useScrollDepth as jest.Mock).mockReturnValue({
      depth: 100,
      isReading: true,
      isFinished: true,
    });

    const { container } = render(<DepthBar articleId="test-article" />);

    // Should render initially
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();

    // Should fade out after 800ms
    await waitFor(
      () => {
        expect(container.firstChild).toBeNull();
      },
      { timeout: 1000 }
    );
  });

  it('should have correct accessibility attributes', () => {
    (useScrollDepth as jest.Mock).mockReturnValue({
      depth: 75,
      isReading: true,
      isFinished: false,
    });

    render(<DepthBar articleId="test-article" />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(progressBar).toHaveAttribute('aria-label', 'Reading progress: 75%');
  });

  it('should have responsive design classes', () => {
    (useScrollDepth as jest.Mock).mockReturnValue({
      depth: 50,
      isReading: true,
      isFinished: false,
    });

    const { container } = render(<DepthBar articleId="test-article" />);

    // Check for responsive classes
    const progressBar = container.querySelector('.fixed.bottom-0');
    expect(progressBar).toBeInTheDocument();

    // Should have mobile-optimized padding
    const paddingContainer = container.querySelector('.px-4.sm\\:px-8');
    expect(paddingContainer).toBeInTheDocument();
  });
});
