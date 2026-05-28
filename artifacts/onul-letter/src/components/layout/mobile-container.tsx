import React, { useRef, useEffect } from 'react';

export function MobileContainer({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen w-full bg-background flex justify-center overflow-hidden">
      {/* Optional Background Image Element */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/cozy-bg.png')` }}
      />
      
      <div className="w-full max-w-md relative flex flex-col h-[100dvh] bg-background/80 backdrop-blur-3xl shadow-2xl z-10">
        {/* pb accounts for fixed bottom nav (56px) + safe-area inset + comfortable clearance */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto scroll-smooth"
          style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
