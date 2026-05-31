"use client"

import { cn } from "@/utils/cn"
import { Popover, Slot } from "radix-ui"
import {
  Context,
  composeEventHandlers,
  useControllableState,
} from "radix-ui/internal"
import {
  type ComponentProps,
  type ComponentPropsWithRef,
  type ReactNode,
  useCallback,
  useMemo,
} from "react"

type MaybeRenderProp<TArgs> = ReactNode | ((args: TArgs) => ReactNode)

export interface PickerFieldSelectOptions {
  close?: boolean
}

export interface PickerFieldRootRenderProps<TValue> {
  value: TValue | undefined
  open: boolean
  disabled: boolean
  hasValue: boolean
  setOpen: (open: boolean) => void
  close: () => void
  select: (value: TValue, options?: PickerFieldSelectOptions) => void
  clear: (options?: PickerFieldSelectOptions) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PickerFieldContextValue<
  TValue,
> extends PickerFieldRootRenderProps<TValue> {}

export interface PickerFieldRootProps<TValue> {
  children?: ReactNode
  value: TValue | undefined
  onValueChange: (value: TValue | undefined) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  closeOnSelect?: boolean
}

export type PickerFieldTriggerRenderProps<TValue> =
  PickerFieldRootRenderProps<TValue>

export type PickerFieldTriggerProps<TValue> = Omit<
  ComponentPropsWithRef<typeof Popover.Trigger>,
  "children"
> & {
  children?: MaybeRenderProp<PickerFieldTriggerRenderProps<TValue>>
}

type PopoverPortalProps = ComponentProps<typeof Popover.Portal>

export type PickerFieldContentProps = ComponentPropsWithRef<
  typeof Popover.Content
> & {
  portalled?: boolean
  portalContainer?: PopoverPortalProps["container"]
}

export interface PickerFieldItemRenderProps<
  TValue,
> extends PickerFieldRootRenderProps<TValue> {
  itemValue: TValue
  selected: boolean
}

export type PickerFieldItemProps<TValue> = Omit<
  ComponentPropsWithRef<"button">,
  "children" | "value"
> & {
  asChild?: boolean
  children?: MaybeRenderProp<PickerFieldItemRenderProps<TValue>>
  closeOnSelect?: boolean
  isSelected?: (currentValue: TValue | undefined, itemValue: TValue) => boolean
  value: TValue
}

export type PickerFieldValueRenderProps<TValue> =
  PickerFieldRootRenderProps<TValue>

export interface PickerFieldValueProps<TValue> {
  children: (args: PickerFieldValueRenderProps<TValue>) => ReactNode
}

const getHasValue = <TValue,>(value: TValue | undefined) =>
  value !== undefined && value !== null

const renderMaybeFunction = <TArgs,>(
  children: MaybeRenderProp<TArgs> | undefined,
  args: TArgs
) => (typeof children === "function" ? children(args) : children)

export function createPickerField<TValue = never>(name = "PickerField") {
  const [PickerFieldProvider, usePickerFieldContext] =
    Context.createContext<PickerFieldContextValue<TValue>>(name)

  const useContext = (consumerName: string) =>
    usePickerFieldContext(consumerName)

  const Root = ({
    children,
    value,
    onValueChange,
    open: openProp,
    defaultOpen,
    onOpenChange,
    disabled = false,
    closeOnSelect = true,
  }: PickerFieldRootProps<TValue>) => {
    const [open, setOpenValue] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? false,
      onChange: onOpenChange,
    })

    const effectiveOpen = disabled ? false : open

    const setOpen = useCallback(
      (nextOpen: boolean) => {
        setOpenValue(disabled ? false : nextOpen)
      },
      [disabled, setOpenValue]
    )

    const close = useCallback(() => {
      setOpenValue(false)
    }, [setOpenValue])

    const select = useCallback(
      (nextValue: TValue, options?: PickerFieldSelectOptions) => {
        if (disabled) return

        onValueChange(nextValue)

        if (options?.close ?? closeOnSelect) {
          setOpenValue(false)
        }
      },
      [closeOnSelect, disabled, onValueChange, setOpenValue]
    )

    const clear = useCallback(
      (options?: PickerFieldSelectOptions) => {
        if (disabled) return

        onValueChange(undefined)

        if (options?.close ?? closeOnSelect) {
          setOpenValue(false)
        }
      },
      [closeOnSelect, disabled, onValueChange, setOpenValue]
    )

    const context = useMemo<PickerFieldContextValue<TValue>>(
      () => ({
        value,
        open: effectiveOpen,
        disabled,
        hasValue: getHasValue(value),
        setOpen,
        close,
        select,
        clear,
      }),
      [clear, close, disabled, effectiveOpen, select, setOpen, value]
    )

    return (
      <PickerFieldProvider {...context}>
        <Popover.Root open={effectiveOpen} onOpenChange={setOpen}>
          {children}
        </Popover.Root>
      </PickerFieldProvider>
    )
  }

  const Trigger = ({
    children,
    className,
    disabled,
    ref,
    ...props
  }: PickerFieldTriggerProps<TValue>) => {
    const context = useContext(`${name}.Trigger`)
    const triggerDisabled = disabled || context.disabled

    return (
      <Popover.Trigger
        ref={ref}
        className={cn(
          "group grid min-h-field w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1 rounded-xl bg-surface-muted px-4 py-3 text-left font-sans text-primary transition-colors duration-150 ease-standard outline-none hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground data-disabled:cursor-not-allowed data-disabled:bg-disabled data-disabled:text-disabled-foreground data-[state=open]:bg-surface-hover",
          className
        )}
        data-disabled={triggerDisabled ? "" : undefined}
        data-has-value={context.hasValue ? "" : undefined}
        data-slot="picker-field-trigger"
        data-state={context.open ? "open" : "closed"}
        disabled={triggerDisabled}
        {...props}
      >
        {renderMaybeFunction(children, context)}
      </Popover.Trigger>
    )
  }

  const Content = ({
    children,
    className,
    portalled = true,
    portalContainer,
    forceMount,
    ref,
    ...props
  }: PickerFieldContentProps) => {
    const content = (
      <Popover.Content
        ref={ref}
        className={cn(
          "z-50 w-(--radix-popover-trigger-width) rounded-2xl bg-surface-raised p-3 text-primary shadow-popover outline-none data-[state=open]:animate-popover-in",
          className
        )}
        data-slot="picker-field-content"
        forceMount={forceMount}
        {...props}
      >
        {children}
      </Popover.Content>
    )

    if (!portalled) return content

    return (
      <Popover.Portal container={portalContainer} forceMount={forceMount}>
        {content}
      </Popover.Portal>
    )
  }

  const Item = ({
    asChild,
    children,
    closeOnSelect,
    className,
    disabled,
    isSelected = Object.is,
    onClick,
    ref,
    type = "button",
    value: itemValue,
    ...props
  }: PickerFieldItemProps<TValue>) => {
    const context = useContext(`${name}.Item`)
    const itemDisabled = disabled || context.disabled
    const selected = isSelected(context.value, itemValue)
    const Comp = asChild ? Slot.Root : "button"

    const handleClick = composeEventHandlers(onClick, () => {
      if (itemDisabled) return
      context.select(itemValue, { close: closeOnSelect })
    })

    const itemRenderProps: PickerFieldItemRenderProps<TValue> = {
      ...context,
      itemValue,
      selected,
    }

    return (
      <Comp
        ref={ref}
        aria-disabled={itemDisabled || undefined}
        aria-selected={selected}
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left font-sans text-body font-semibold text-primary transition-colors duration-150 ease-standard outline-none hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:hover:bg-transparent disabled:hover:text-disabled-foreground data-disabled:cursor-not-allowed data-disabled:text-disabled-foreground data-disabled:hover:bg-transparent data-disabled:hover:text-disabled-foreground data-selected:bg-primary data-selected:text-primary-foreground",
          className
        )}
        data-disabled={itemDisabled ? "" : undefined}
        data-selected={selected ? "" : undefined}
        data-slot="picker-field-item"
        disabled={asChild ? undefined : itemDisabled}
        onClick={handleClick}
        role="option"
        type={asChild ? undefined : type}
        {...props}
      >
        {renderMaybeFunction(children, itemRenderProps)}
      </Comp>
    )
  }

  const Value = ({ children }: PickerFieldValueProps<TValue>) => {
    const context = useContext(`${name}.Value`)
    return children(context)
  }

  return {
    Root,
    Trigger,
    Content,
    Item,
    Value,
    Anchor: Popover.Anchor,
    Arrow: Popover.Arrow,
    Close: Popover.Close,
    useContext,
  }
}
