interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'transparent' | 'colored';
  showText?: boolean;
}

export default function Logo({ 
  className = "", 
  size = 'md', 
  variant = 'colored',
  showText = true 
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto', 
    lg: 'h-10 w-auto',
    xl: 'h-12 w-auto',
    '2xl': 'h-16 w-auto'
  };

  const logoSrc = variant === 'transparent' ? '/assets/transparent-logo.png?v=2' : '/assets/colored-logo.png?v=2';

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoSrc}
        alt="Argilette NODE CRM" 
        className={`${sizeClasses[size]} object-contain`}
        style={{ minWidth: size === 'sm' ? '24px' : size === 'md' ? '32px' : size === 'lg' ? '40px' : '48px' }}
      />
    </div>
  );
}