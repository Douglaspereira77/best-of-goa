import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preview - New Design',
  description: 'Preview of the new Best of Goa homepage design',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Preview banner */}
      <div className="fixed bottom-4 right-4 z-[100] bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        Preview Mode
      </div>
      {children}
    </>
  );
}
