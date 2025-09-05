import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface AnimatedPageTransitionProps {
  children: React.ReactNode
  pageKey: string
  direction?: 'forward' | 'backward'
  className?: string
}

export function AnimatedPageTransition({
  children,
  pageKey,
  direction = 'forward',
  className = '',
}: AnimatedPageTransitionProps) {
  const prefersReducedMotion = useReducedMotion()

  // Use transform + opacity only (GPU friendly), avoid blur/scale to reduce jank
  const variants = {
    enter: prefersReducedMotion
      ? { opacity: 0 }
      : { x: direction === 'forward' ? 24 : -24, opacity: 0 },
    center: prefersReducedMotion ? { opacity: 1 } : { x: 0, opacity: 1 },
    exit: prefersReducedMotion
      ? { opacity: 0 }
      : { x: direction === 'forward' ? -24 : 24, opacity: 0 },
  }

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pageKey}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          // Smooth tween to avoid spring-induced wobble
          transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.32 }}
          // Animate layout changes to reduce jump when content height differs
          layout
          style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
          className={className}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// 卡片进入动画组件
interface AnimatedGridProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
}

export function AnimatedGrid({ children, className = '', staggerDelay = 0.1 }: AnimatedGridProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: {
              opacity: 0,
              y: 30,
              scale: 0.9,
            },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 25,
              },
            },
          }}
          className="h-full"
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// 面包屑动画组件
export function AnimatedBreadcrumb({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// 标题动画组件
export function AnimatedTitle({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
