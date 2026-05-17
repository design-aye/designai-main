import { cn } from '@/lib/utils';

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export function LogoMark({ className, size = 32 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="logo-cut" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5b21b6" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect width="32" height="32" rx="8" fill="url(#logo-bg)" />
      {/* Outer D shape */}
      <path d="M9 8h7C20.3 8 24 11.6 24 16s-3.7 8-8 8H9V8z" fill="white" opacity="0.95" />
      {/* Inner cutout to form hollow D */}
      <path d="M12 11.5h3.8C17.9 11.5 20.2 13.5 20.2 16s-2.3 4.5-4.4 4.5H12V11.5z" fill="url(#logo-cut)" />
      {/* Orange accent dot */}
      <circle cx="25.5" cy="7.5" r="2.5" fill="#f97316" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { mark: 22, text: 'text-base' },
  md: { mark: 28, text: 'text-lg' },
  lg: { mark: 36, text: 'text-2xl' },
};

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={s.mark} />
      {showText && (
        <span className={cn('font-bold tracking-tight text-text-primary', s.text)}>
          Design<span className="text-accent">AI</span>
        </span>
      )}
    </div>
  );
}
