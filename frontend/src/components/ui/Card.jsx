import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export default function Card({ children, className, hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('glass rounded-xl p-5', hover && 'glass-hover transition-all duration-200', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
