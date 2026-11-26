import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const baseClasses = 'animate-pulse bg-slate-800/60';
  const variantClasses = {
    text: 'rounded h-3',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  }[variant];

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return <div className={`${baseClasses} ${variantClasses} ${className}`} style={style} />;
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <Skeleton variant="rectangular" width="30%" height={24} />
          <Skeleton variant="rectangular" width="20%" height={24} />
          <Skeleton variant="rectangular" width="15%" height={24} />
          <Skeleton variant="rectangular" width="15%" height={24} />
          <Skeleton variant="rectangular" width="20%" height={24} />
        </div>
      ))}
    </div>
  );
};
