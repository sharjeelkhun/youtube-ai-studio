import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsChangeProps {
  value: number | null | undefined;
}

export function MetricsChange({ value }: MetricsChangeProps) {
  if (value == null) return null;
  const isPositive = value >= 0;

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
        ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
      `}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {isPositive ? '+' : ''}{value}%
    </motion.span>
  );
}
