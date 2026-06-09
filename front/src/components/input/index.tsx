"use client"

import { Input as BaseInput } from "@base-ui/react/input"
import { cn } from "@/utils/cn"
import { type ComponentProps, type ReactNode } from "react"

import { input } from "./styles"

const styles = input()

type BaseInputProps = ComponentProps<typeof BaseInput>

export type InputProps = BaseInputProps & {
  trailing?: ReactNode
}

export function Input({ className, disabled, trailing, ...props }: InputProps) {
  return (
    <div
      className={styles.root({
        disabled,
      })}
    >
      <BaseInput
        className={(state) =>
          cn(
            styles.control({
              disabled: state.disabled,
            }),
            typeof className === "function" ? className(state) : className
          )
        }
        disabled={disabled}
        {...props}
      />

      {trailing ? (
        <span
          className={styles.trailing({
            disabled,
          })}
        >
          {trailing}
        </span>
      ) : null}
    </div>
  )
}

Input.displayName = "Input"
