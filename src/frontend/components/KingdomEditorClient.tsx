'use client';

import dynamic from 'next/dynamic';

const KingdomEditor = dynamic(() => import('./KingdomEditor'), { ssr: false });

export default function KingdomEditorClient() {
  return <KingdomEditor />;
}
