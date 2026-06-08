import { Link, useLocation } from 'wouter';
import { Home, PenLine, CalendarDays, Archive, Mail, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tabs = [
  { href: '/home',        icon: Home,         label: '홈' },
  { href: '/record',      icon: PenLine,       label: '기록' },
  { href: '/calendar',    icon: CalendarDays,  label: '달력' },
  { href: '/',            icon: Archive,       label: '보관함' },
  { href: '/time-letter', icon: Mail,          label: '편지함' },
  { href: '/settings',    icon: Settings,      label: '설정' },
];

export function BottomNav() {
  const [location] = useLocation();

  return createPortal(
    <div className="fixed bottom-0 inset-x-0 z-[100] flex justify-center pointer-events-none">
      {/*
        bg-background/95 uses hsl(var(--background) / 0.95) which automatically
        shifts from warm cream (light) to deep navy (dark) via the CSS variable.
        border-border/50 likewise adapts to dark mode via the CSS variable.
      */}
      <div
        className="w-full max-w-md bg-background/95 backdrop-blur-xl border-t border-border/50 pb-safe pointer-events-auto"
      >
        <div className="flex items-center justify-around h-14 px-1">
          {tabs.map((tab) => {
            const isActive = location === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 group"
              >
                <div className="relative flex items-center justify-center">
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary/15 rounded-full -m-1.5"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-medium transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-foreground'
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
