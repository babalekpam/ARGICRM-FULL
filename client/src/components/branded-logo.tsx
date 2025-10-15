import Logo from './logo';

interface BrandedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'transparent' | 'colored';
}

export function BrandedLogo({ className = "", size = 'md', variant = 'colored' }: BrandedLogoProps) {
  return (
    <Logo 
      className={className}
      size={size}
      variant={variant}
    />
  );
}