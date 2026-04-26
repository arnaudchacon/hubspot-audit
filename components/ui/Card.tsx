import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-bg border border-border rounded-lg p-6 transition-[border-color,box-shadow] duration-150 hover:border-border-strong hover:shadow-hover ${className}`}
      {...props}
    />
  );
}
