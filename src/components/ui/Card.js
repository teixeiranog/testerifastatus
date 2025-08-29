import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  onClick,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-md hover:-translate-y-1 cursor-pointer' : '';
  
  const classes = [
    baseClasses,
    hoverClasses,
    paddingClasses[padding],
    className
  ].join(' ');

  const Component = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <Component
      className={classes}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
