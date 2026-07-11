'use client';

import * as React from 'react';

/**
 * True once /api/auth/providers confirms Google OAuth is configured.
 * Defaults to false so the button never renders when sign-in would fail.
 */
export function useGoogleAuth(): boolean {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/providers')
      .then((r) => (r.ok ? r.json() : null))
      .then((providers) => {
        if (!cancelled && providers && 'google' in providers) {
          setEnabled(true);
        }
      })
      .catch(() => {
        /* keep hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
