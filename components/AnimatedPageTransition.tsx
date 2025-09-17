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
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function AnimatedGrid({ children, className = '', staggerDelay = 0.1 }: AnimatedGridProps) {
  const childArray = React.Children.toArray(children)
  const prefersReducedMotion = useReducedMotion()

  const childVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        hidden: {
          opacity: 0,
          y: 24,
          scale: 0.96,
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: 'tween' as const,
            ease: [0.16, 1, 0.3, 1] as const,
            duration: 0.26,
          },
        },
        exit: {
          opacity: 0,
          y: -16,
          scale: 0.97,
          transition: {
            type: 'tween' as const,
            ease: [0.33, 1, 0.68, 1] as const,
            duration: 0.2,
          },
        },
      }

  return (
    <motion.div
      className={className}
      layout
      style={{ willChange: 'transform, opacity' }}
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
      <AnimatePresence mode="popLayout">
        {childArray.map((child, index) => {
          let key: React.Key = index
          if (React.isValidElement(child) && child.key != null) {
            key = child.key
          }

          return (
            <motion.div
              key={key}
              variants={childVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              style={{ willChange: 'transform, opacity' }}
              className="h-full"
            >
              {child}
            </motion.div>
          )
        })}
      </AnimatePresence>
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
