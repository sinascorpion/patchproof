import type { Metadata } from 'next';
import './style.css';
export const metadata: Metadata = { title: 'PatchProof — evidence for every upgrade', description: 'Compare known open-source vulnerability advisories with independently verified on-chain records.' };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }

