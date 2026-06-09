"use client"

import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

import { cn } from "@/utils/cn"

type WordRotatePreset = "roll-up" | "roll-down" | "fade"

type WordRotateMotion = {
  initial: {
    opacity: number
    y?: number
  }
  animate: {
    opacity: number
    y?: number
  }
  exit: {
    opacity: number
    y?: number
  }
}

const presets: Record<WordRotatePreset, WordRotateMotion> = {
  "roll-up": {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },
  "roll-down": {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 16 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
}

interface WordRotateProps {
  words: string[]
  interval?: number
  preset?: WordRotatePreset
  transitionDuration?: number
  className?: string
}

export function WordRotate({
  words,
  interval = 2500,
  preset = "roll-up",
  transitionDuration = 1,
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0)
  const motionPreset = presets[preset]

  useEffect(() => {
    if (words.length <= 1) {
      return
    }

    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, interval)

    return () => clearInterval(timer)
  }, [interval, words.length])

  if (words.length === 0) {
    return null
  }

  const word = words[index % words.length]

  return (
    <div className="overflow-hidden py-2">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={`${index}-${word}`}
          className={cn("block", className)}
          initial={motionPreset.initial}
          animate={motionPreset.animate}
          exit={motionPreset.exit}
          transition={{ duration: transitionDuration, ease: "easeOut" }}
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
