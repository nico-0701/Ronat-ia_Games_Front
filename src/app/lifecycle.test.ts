import { describe, expect, it, vi } from 'vitest';
import { FakeHub } from '@/test/fakeHub';
import { registerLifecycle } from './lifecycle';
import type { Services } from './services';

function servicesWith(hub: FakeHub): Services {
  return { live: hub } as unknown as Services;
}

describe('registerLifecycle', () => {
  it('ao voltar a ser visível, reconecta o tempo real', () => {
    const hub = new FakeHub();
    const resume = vi.spyOn(hub, 'resume');
    const stop = registerLifecycle(servicesWith(hub));

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(resume).toHaveBeenCalledTimes(1);
    stop();
  });

  it('com a aba escondida não faz nada', () => {
    const hub = new FakeHub();
    const resume = vi.spyOn(hub, 'resume');
    const stop = registerLifecycle(servicesWith(hub));

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(resume).not.toHaveBeenCalled();
    stop();
  });

  it('depois de desfeito, para de escutar', () => {
    const hub = new FakeHub();
    const resume = vi.spyOn(hub, 'resume');
    registerLifecycle(servicesWith(hub))();

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(resume).not.toHaveBeenCalled();
  });
});
