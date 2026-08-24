'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/nela-api';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';
import { useAuth } from '@/components/AuthProvider';

const CODE_LENGTH = 8;

function normalizeChars(value: string): string[] {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH)
    .split('');
}

export default function LinkDevicePage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/account/link-device');
    }
  }, [isReady, isAuthenticated, router]);

  const focusIndex = useCallback((index: number) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const applyChars = useCallback(
    (chars: string[], startIndex = 0) => {
      setDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < chars.length && startIndex + i < CODE_LENGTH; i += 1) {
          next[startIndex + i] = chars[i]!;
        }
        return next;
      });
      const nextFocus = Math.min(startIndex + chars.length, CODE_LENGTH - 1);
      requestAnimationFrame(() => focusIndex(nextFocus));
    },
    [focusIndex],
  );

  const submitCode = async (event?: FormEvent) => {
    event?.preventDefault();
    const userCode = digits.join('');
    if (userCode.length !== CODE_LENGTH) {
      setError('Enter all 8 characters from the desktop app');
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await apiFetch<{ ok: true; deviceName: string | null }>(
        '/v1/auth/device/approve',
        {
          method: 'POST',
          body: JSON.stringify({ userCode }),
        },
      );
      setSuccess(
        result.deviceName
          ? `Linked “${result.deviceName}”. You can return to NELA Desktop.`
          : 'Desktop linked. You can return to NELA Desktop.',
      );
      setDigits(Array(CODE_LENGTH).fill(''));
    } catch (err) {
      setError(friendlyErrorFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
    event.preventDefault();
    const chars = normalizeChars(event.clipboardData.getData('text'));
    if (chars.length) applyChars(chars, index);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      setDigits((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = '';
        } else if (index > 0) {
          next[index - 1] = '';
          requestAnimationFrame(() => focusIndex(index - 1));
        }
        return next;
      });
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
    }
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };

  if (!isReady || !isAuthenticated) {
    return (
      <p style={{ color: 'var(--text-secondary)' }}>Checking sign-in…</p>
    );
  }

  return (
    <div>
        <h1 className="mb-2 font-space text-3xl font-bold tracking-tight sm:text-4xl">
          Link desktop app
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Enter the 8-character code shown in NELA Desktop. You are already signed
          in here, so this only authorizes that device.
        </p>

        <form
          onSubmit={(e) => void submitCode(e)}
          className="rounded-2xl border p-6"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-card)',
          }}
        >
          <div className="mb-6 flex justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
                maxLength={1}
                value={digit}
                disabled={busy}
                className="h-12 w-9 rounded-lg border text-center font-mono text-lg font-semibold uppercase outline-none sm:h-14 sm:w-11 sm:text-xl"
                style={{
                  borderColor: 'var(--border-primary)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
                onChange={(e) => {
                  const chars = normalizeChars(e.target.value);
                  if (!chars.length) {
                    setDigits((prev) => {
                      const next = [...prev];
                      next[index] = '';
                      return next;
                    });
                    return;
                  }
                  applyChars(chars, index);
                }}
                onKeyDown={(e) => onKeyDown(e, index)}
                onPaste={(e) => onPaste(e, index)}
                onFocus={(e) => e.currentTarget.select()}
              />
            ))}
          </div>

          {error ? (
            <p className="mb-4 text-sm" style={{ color: '#e11d48' }}>
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mb-4 text-sm" style={{ color: 'var(--accent)' }}>
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || digits.join('').length !== CODE_LENGTH}
            className="w-full rounded-full px-5 py-3 font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            {busy ? 'Linking…' : 'Authorize desktop'}
          </button>
        </form>
    </div>
  );
}
