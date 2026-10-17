import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useService, useWsPush } from './useService';
import { MockWsClient, wsClient } from '../ws/client';

function Probe({ fn }: { fn: () => Promise<string> }) {
  const { data, loading, error } = useService(fn);
  if (loading) return <div>loading</div>;
  if (error) return <div>error:{error.message}</div>;
  return <div>data:{data}</div>;
}

describe('useService', () => {
  it('moves loading → data when the call resolves', async () => {
    render(<Probe fn={() => Promise.resolve('hello')} />);
    expect(screen.getByText('loading')).toBeTruthy();
    await screen.findByText('data:hello');
  });

  it('surfaces errors as error state', async () => {
    render(<Probe fn={() => Promise.reject(new Error('boom'))} />);
    await screen.findByText('error:boom');
  });
});

describe('useWsPush', () => {
  it('fires the callback for pushes while mounted', () => {
    expect(wsClient instanceof MockWsClient).toBe(true);
    if (!(wsClient instanceof MockWsClient)) return;

    let hits = 0;
    function P() {
      useWsPush(() => {
        hits += 1;
      });
      return null;
    }
    const { unmount } = render(<P />);
    wsClient.emit('test', 'One', {});
    wsClient.emit('test', 'Two', {});
    expect(hits).toBe(2);

    unmount();
    wsClient.emit('test', 'Three', {});
    expect(hits).toBe(2);
  });
});
