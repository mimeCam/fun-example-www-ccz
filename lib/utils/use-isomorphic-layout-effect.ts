/**
 * useIsomorphicLayoutEffect — useLayoutEffect on the client, useEffect on
 * the server. Avoids the SSR hydration warning when a hook needs to run
 * synchronously after paint but must not break rendering on Node.
 *
 * Shared because Threshold + any other portal-ish primitive will want it.
 */

import { useEffect, useLayoutEffect } from 'react';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
