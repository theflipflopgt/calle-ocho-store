'use client';

import { motion } from 'framer-motion';
import { Button } from './button';
import { ComponentProps } from 'react';

type AnimatedButtonProps = ComponentProps<typeof Button> & {
  whileHover?: any;
  whileTap?: any;
};

export function AnimatedButton({
  children,
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.98 },
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div whileHover={whileHover} whileTap={whileTap}>
      <Button {...props}>{children}</Button>
    </motion.div>
  );
}
