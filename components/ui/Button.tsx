import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const base = 'inline-flex items-center justify-center rounded-[6px] text-body font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:   'bg-accent text-white px-5 py-2.5 hover:bg-accent-hover',
  secondary: 'bg-bg text-text-primary border border-border-strong px-[19px] py-[9px] hover:bg-surface',
  ghost:     'bg-transparent text-text-secondary px-4 py-2.5 hover:bg-surface',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
