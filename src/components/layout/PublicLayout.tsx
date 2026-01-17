'use client';

import { usePathname } from 'next/navigation';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname ? pathname.startsWith('/admin') : false;
  const isPreviewRoute = pathname ? pathname.startsWith('/preview') : false;
  const isHomepage = pathname === '/';

  // Don't render header/footer for admin, preview, or homepage routes (homepage has custom header/footer)
  if (isAdminRoute || isPreviewRoute || isHomepage) {
    return <>{children}</>;
  }

  return (
    <>
      <PublicHeader />
      <main suppressHydrationWarning>{children}</main>
      <PublicFooter />
    </>
  );
}


