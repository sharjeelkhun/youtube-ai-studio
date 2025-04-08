import { motion } from 'framer-motion';
import { BarChart } from 'lucide-react';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-72 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg"
    >
      <BarChart className="w-12 h-12 text-gray-400 mb-3" />
      <p className="text-gray-500 font-medium">{message}</p>
    </motion.div>
  );
}
