"use client"

import { Select as BaseSelect } from "@base-ui/react/select"
import { cn } from "@/utils/cn"
import {
  Check,
  ChevronDown,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react"
import type { ComponentProps } from "react"

import { select } from "./styles"

const styles = select()

export type RootProps<
  Value,
  Multiple extends boolean | undefined = false,
> = BaseSelect.Root.Props<Value, Multiple>

export const Root = BaseSelect.Root
export const Portal = BaseSelect.Portal
export const Backdrop = BaseSelect.Backdrop
export const Arrow = BaseSelect.Arrow

export type LabelProps = ComponentProps<typeof BaseSelect.Label>

export function Label({ className, ref, ...props }: LabelProps) {
  return (
    <BaseSelect.Label
      ref={ref}
      className={cn("type-label text-muted", className)}
      data-slot="select-label"
      {...props}
    />
  )
}

Label.displayName = "SelectLabel"

export type TriggerProps = ComponentProps<typeof BaseSelect.Trigger>

export function Trigger({
  children,
  className,
  ref,
  type = "button",
  ...props
}: TriggerProps) {
  return (
    <BaseSelect.Trigger
      ref={ref}
      className={cn(styles.trigger(), className)}
      data-slot="select-trigger"
      type={type}
      {...props}
    >
      {children}
    </BaseSelect.Trigger>
  )
}

Trigger.displayName = "SelectTrigger"

export type ValueProps = ComponentProps<typeof BaseSelect.Value>

export function Value({ className, ref, ...props }: ValueProps) {
  return (
    <BaseSelect.Value
      ref={ref}
      className={cn(styles.value(), className)}
      data-slot="select-value"
      {...props}
    />
  )
}

Value.displayName = "SelectValue"

export type IconProps = ComponentProps<typeof BaseSelect.Icon>

export function Icon({ children, className, ref, ...props }: IconProps) {
  return (
    <BaseSelect.Icon
      ref={ref}
      className={cn(styles.icon(), className)}
      data-slot="select-icon"
      {...props}
    >
      {children ?? <ChevronDown aria-hidden="true" />}
    </BaseSelect.Icon>
  )
}

Icon.displayName = "SelectIcon"

export type PositionerProps = ComponentProps<typeof BaseSelect.Positioner>

export function Positioner({ className, ref, ...props }: PositionerProps) {
  return (
    <BaseSelect.Positioner
      ref={ref}
      className={cn(styles.positioner(), className)}
      data-slot="select-positioner"
      {...props}
    />
  )
}

Positioner.displayName = "SelectPositioner"

export type PopupProps = ComponentProps<typeof BaseSelect.Popup>

export function Popup({ className, ref, ...props }: PopupProps) {
  return (
    <BaseSelect.Popup
      ref={ref}
      className={cn(styles.popup(), className)}
      data-slot="select-popup"
      {...props}
    />
  )
}

Popup.displayName = "SelectPopup"

export type ContentProps = PopupProps & {
  portalled?: boolean
  portalProps?: Omit<ComponentProps<typeof BaseSelect.Portal>, "children">
  positionerProps?: Omit<PositionerProps, "children">
}

export function Content({
  children,
  className,
  portalled = true,
  portalProps,
  positionerProps,
  ref,
  ...props
}: ContentProps) {
  const content = (
    <Positioner {...positionerProps}>
      <BaseSelect.ScrollUpArrow className={styles.scrollUpFade()} keepMounted>
        {""}
      </BaseSelect.ScrollUpArrow>
      <Popup ref={ref} className={className} {...props}>
        {children}
      </Popup>
      <BaseSelect.ScrollDownArrow
        className={styles.scrollDownFade()}
        keepMounted
      >
        {""}
      </BaseSelect.ScrollDownArrow>
    </Positioner>
  )

  if (!portalled) return content

  return <BaseSelect.Portal {...portalProps}>{content}</BaseSelect.Portal>
}

Content.displayName = "SelectContent"

export type ListProps = ComponentProps<typeof BaseSelect.List>

export function List({ className, ref, ...props }: ListProps) {
  return (
    <BaseSelect.List
      ref={ref}
      className={cn(styles.list(), className)}
      data-slot="select-list"
      {...props}
    />
  )
}

List.displayName = "SelectList"

export type ItemProps = ComponentProps<typeof BaseSelect.Item>

export function Item({ className, ref, ...props }: ItemProps) {
  return (
    <BaseSelect.Item
      ref={ref}
      className={cn(styles.item(), className)}
      data-slot="select-item"
      {...props}
    />
  )
}

Item.displayName = "SelectItem"

export type ItemTextProps = ComponentProps<typeof BaseSelect.ItemText>

export function ItemText({ className, ref, ...props }: ItemTextProps) {
  return (
    <BaseSelect.ItemText
      ref={ref}
      className={cn(styles.itemText(), className)}
      data-slot="select-item-text"
      {...props}
    />
  )
}

ItemText.displayName = "SelectItemText"

export type ItemIndicatorProps = ComponentProps<typeof BaseSelect.ItemIndicator>

export function ItemIndicator({
  children,
  className,
  ref,
  ...props
}: ItemIndicatorProps) {
  return (
    <BaseSelect.ItemIndicator
      ref={ref}
      className={cn(styles.itemIndicator(), className)}
      data-slot="select-item-indicator"
      {...props}
    >
      {children ?? <Check aria-hidden="true" />}
    </BaseSelect.ItemIndicator>
  )
}

ItemIndicator.displayName = "SelectItemIndicator"

export type GroupProps = ComponentProps<typeof BaseSelect.Group>

export function Group({ className, ref, ...props }: GroupProps) {
  return (
    <BaseSelect.Group
      ref={ref}
      className={cn(styles.group(), className)}
      data-slot="select-group"
      {...props}
    />
  )
}

Group.displayName = "SelectGroup"

export type GroupLabelProps = ComponentProps<typeof BaseSelect.GroupLabel>

export function GroupLabel({ className, ref, ...props }: GroupLabelProps) {
  return (
    <BaseSelect.GroupLabel
      ref={ref}
      className={cn(styles.groupLabel(), className)}
      data-slot="select-group-label"
      {...props}
    />
  )
}

GroupLabel.displayName = "SelectGroupLabel"

export type SeparatorProps = ComponentProps<typeof BaseSelect.Separator>

export function Separator({ className, ref, ...props }: SeparatorProps) {
  return (
    <BaseSelect.Separator
      ref={ref}
      className={cn(styles.separator(), className)}
      data-slot="select-separator"
      {...props}
    />
  )
}

Separator.displayName = "SelectSeparator"

export type ScrollUpArrowProps = ComponentProps<typeof BaseSelect.ScrollUpArrow>

export function ScrollUpArrow({
  children,
  className,
  ref,
  ...props
}: ScrollUpArrowProps) {
  return (
    <BaseSelect.ScrollUpArrow
      ref={ref}
      className={cn(styles.scrollArrow(), className)}
      data-slot="select-scroll-up-arrow"
      {...props}
    >
      {children ?? <ChevronUpIcon aria-hidden="true" />}
    </BaseSelect.ScrollUpArrow>
  )
}

ScrollUpArrow.displayName = "SelectScrollUpArrow"

export type ScrollDownArrowProps = ComponentProps<
  typeof BaseSelect.ScrollDownArrow
>

export function ScrollDownArrow({
  children,
  className,
  ref,
  ...props
}: ScrollDownArrowProps) {
  return (
    <BaseSelect.ScrollDownArrow
      ref={ref}
      className={cn(styles.scrollArrow(), className)}
      data-slot="select-scroll-down-arrow"
      {...props}
    >
      {children ?? <ChevronDownIcon aria-hidden="true" />}
    </BaseSelect.ScrollDownArrow>
  )
}

ScrollDownArrow.displayName = "SelectScrollDownArrow"
