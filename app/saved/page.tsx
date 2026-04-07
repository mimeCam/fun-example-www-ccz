/**
 * /saved — Redirected to /resonances.
 * The old bookmark list is replaced by the resonance system.
 * This page performs a client-side redirect.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SavedRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/resonances'); }, [router]);
  return null;
}
