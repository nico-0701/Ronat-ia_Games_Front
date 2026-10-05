import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfflineBanner } from './OfflineBanner';

function setOnline(value: boolean) {
  vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(value);
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
}

describe('OfflineBanner', () => {
  afterEach(() => vi.restoreAllMocks());

  it('não aparece com internet', () => {
    render(<OfflineBanner />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('aparece quando a internet cai e some quando volta', () => {
    render(<OfflineBanner />);

    setOnline(false);
    expect(screen.getByRole('status')).toHaveTextContent('Sem internet');

    setOnline(true);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
