"use client"

import { Field as BaseField } from "@base-ui/react/field"
import { cn } from "@/utils/cn"
import { type ComponentProps } from "react"

import { field } from "./styles"

const styles = field()

export type FieldRootProps = ComponentProps<typeof BaseField.Root>
export type FieldLabelProps = ComponentProps<typeof BaseField.Label>
export type FieldHelperProps = ComponentProps<typeof BaseField.Description>
export type FieldErrorProps = ComponentProps<typeof BaseField.Error>

export function Root({ className, ...props }: FieldRootProps) {
  return (
    <BaseField.Root
      className={(state) =>
        cn(
          styles.root(),
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}

Root.displayName = "FieldRoot"

export function Label({ className, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      className={(state) =>
        cn(
          styles.label({
            disabled: state.disabled,
            invalid: state.valid === false,
          }),
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}

Label.displayName = "FieldLabel"

export function Helper({ className, ...props }: FieldHelperProps) {
  return (
    <BaseField.Description
      className={(state) =>
        cn(
          styles.helper({
            disabled: state.disabled,
            invalid: state.valid === false,
          }),
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}

Helper.displayName = "FieldHelper"

export function Error({ className, ...props }: FieldErrorProps) {
  return (
    <BaseField.Error
      className={(state) =>
        cn(
          styles.error({
            disabled: state.disabled,
            invalid: state.valid === false,
          }),
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}

Error.displayName = "FieldError"

export const Field = {
  Error,
  Helper,
  Label,
  Root,
}
