"use client"

import {
  Autocomplete as BaseAutocomplete,
  type AutocompleteRootProps,
} from "@base-ui/react/autocomplete"
import { cn } from "@/utils/cn"
import { ChevronDown, X } from "lucide-react"
import { type ComponentProps } from "react"

import { autocomplete } from "./styles"

const styles = autocomplete()

export type RootProps<TItem> = AutocompleteRootProps<TItem>

export const Root = BaseAutocomplete.Root
export const Value = BaseAutocomplete.Value
export const Portal = BaseAutocomplete.Portal
export const Backdrop = BaseAutocomplete.Backdrop
export const Arrow = BaseAutocomplete.Arrow
export const Collection = BaseAutocomplete.Collection
export const Row = BaseAutocomplete.Row
export const Icon = BaseAutocomplete.Icon
export const useFilter = BaseAutocomplete.useFilter
export const useFilteredItems = BaseAutocomplete.useFilteredItems

export type SearchProps = ComponentProps<"label">

export function Search({ className, ref, ...props }: SearchProps) {
  return (
    <label
      ref={ref}
      className={cn(styles.search(), className)}
      data-slot="autocomplete-search"
      {...props}
    />
  )
}

Search.displayName = "AutocompleteSearch"

export type LabelProps = ComponentProps<"span">

export function Label({ className, ref, ...props }: LabelProps) {
  return (
    <span
      ref={ref}
      className={cn(styles.label(), className)}
      data-slot="autocomplete-label"
      {...props}
    />
  )
}

Label.displayName = "AutocompleteLabel"

export type InputGroupProps = ComponentProps<typeof BaseAutocomplete.InputGroup>

export function InputGroup({ className, ref, ...props }: InputGroupProps) {
  return (
    <BaseAutocomplete.InputGroup
      ref={ref}
      className={cn(styles.inputGroup(), className)}
      data-slot="autocomplete-input-group"
      {...props}
    />
  )
}

InputGroup.displayName = "AutocompleteInputGroup"

export type InputProps = ComponentProps<typeof BaseAutocomplete.Input>

export function Input({ className, ref, ...props }: InputProps) {
  return (
    <BaseAutocomplete.Input
      ref={ref}
      className={cn(styles.input(), className)}
      data-slot="autocomplete-input"
      {...props}
    />
  )
}

Input.displayName = "AutocompleteInput"

export type TriggerProps = ComponentProps<typeof BaseAutocomplete.Trigger>

export function Trigger({
  children,
  className,
  ref,
  type = "button",
  "aria-label": ariaLabel = "목록 열기",
  ...props
}: TriggerProps) {
  return (
    <BaseAutocomplete.Trigger
      ref={ref}
      aria-label={ariaLabel}
      className={cn(styles.action(), className)}
      data-slot="autocomplete-trigger"
      type={type}
      {...props}
    >
      {children ?? <ChevronDown aria-hidden="true" />}
    </BaseAutocomplete.Trigger>
  )
}

Trigger.displayName = "AutocompleteTrigger"

export type ClearProps = ComponentProps<typeof BaseAutocomplete.Clear>

export function Clear({
  children,
  className,
  ref,
  type = "button",
  "aria-label": ariaLabel = "검색어 지우기",
  ...props
}: ClearProps) {
  return (
    <BaseAutocomplete.Clear
      ref={ref}
      aria-label={ariaLabel}
      className={cn(styles.action(), className)}
      data-slot="autocomplete-clear"
      type={type}
      {...props}
    >
      {children ?? <X aria-hidden="true" />}
    </BaseAutocomplete.Clear>
  )
}

Clear.displayName = "AutocompleteClear"

export type ResultsProps = ComponentProps<"div">

export function Results({ className, ref, ...props }: ResultsProps) {
  return (
    <div
      ref={ref}
      className={cn(styles.results(), className)}
      data-slot="autocomplete-results"
      {...props}
    />
  )
}

Results.displayName = "AutocompleteResults"

export type ViewportProps = ComponentProps<"div">

export function Viewport({ className, ref, ...props }: ViewportProps) {
  return (
    <div
      ref={ref}
      className={cn(styles.viewport(), className)}
      data-slot="autocomplete-viewport"
      {...props}
    />
  )
}

Viewport.displayName = "AutocompleteViewport"

export type PositionerProps = ComponentProps<typeof BaseAutocomplete.Positioner>

export function Positioner({ className, ref, ...props }: PositionerProps) {
  return (
    <BaseAutocomplete.Positioner
      ref={ref}
      className={cn(styles.positioner(), className)}
      data-slot="autocomplete-positioner"
      {...props}
    />
  )
}

Positioner.displayName = "AutocompletePositioner"

export type PopupProps = ComponentProps<typeof BaseAutocomplete.Popup>

export function Popup({ className, ref, ...props }: PopupProps) {
  return (
    <BaseAutocomplete.Popup
      ref={ref}
      className={cn(styles.content(), className)}
      data-slot="autocomplete-popup"
      {...props}
    />
  )
}

Popup.displayName = "AutocompletePopup"

export type ContentProps = PopupProps & {
  portalled?: boolean
  portalProps?: Omit<ComponentProps<typeof BaseAutocomplete.Portal>, "children">
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
      <Popup ref={ref} className={className} {...props}>
        {children}
      </Popup>
    </Positioner>
  )

  if (!portalled) return content

  return (
    <BaseAutocomplete.Portal {...portalProps}>
      {content}
    </BaseAutocomplete.Portal>
  )
}

Content.displayName = "AutocompleteContent"

export type ListProps = ComponentProps<typeof BaseAutocomplete.List>

export function List({ className, ref, ...props }: ListProps) {
  return (
    <BaseAutocomplete.List
      ref={ref}
      className={cn(styles.list(), className)}
      data-slot="autocomplete-list"
      {...props}
    />
  )
}

List.displayName = "AutocompleteList"

export type ItemProps = ComponentProps<typeof BaseAutocomplete.Item> & {
  selected?: boolean
}

export function Item({ className, ref, selected, ...props }: ItemProps) {
  return (
    <BaseAutocomplete.Item
      ref={ref}
      className={cn(styles.item(), className)}
      data-selected={selected ? "" : undefined}
      data-slot="autocomplete-item"
      {...props}
    />
  )
}

Item.displayName = "AutocompleteItem"

export type ItemTitleProps = ComponentProps<"span">

export function ItemTitle({ className, ref, ...props }: ItemTitleProps) {
  return (
    <span
      ref={ref}
      className={cn(styles.itemTitle(), className)}
      data-slot="autocomplete-item-title"
      {...props}
    />
  )
}

ItemTitle.displayName = "AutocompleteItemTitle"

export type ItemDescriptionProps = ComponentProps<"small">

export function ItemDescription({
  className,
  ref,
  ...props
}: ItemDescriptionProps) {
  return (
    <small
      ref={ref}
      className={cn(styles.itemDescription(), className)}
      data-slot="autocomplete-item-description"
      {...props}
    />
  )
}

ItemDescription.displayName = "AutocompleteItemDescription"

export type StatusProps = ComponentProps<typeof BaseAutocomplete.Status>

export function Status({ className, ref, ...props }: StatusProps) {
  return (
    <BaseAutocomplete.Status
      ref={ref}
      className={cn(styles.status(), className)}
      data-slot="autocomplete-status"
      {...props}
    />
  )
}

Status.displayName = "AutocompleteStatus"

export type EmptyProps = ComponentProps<typeof BaseAutocomplete.Empty>

export function Empty({ className, ref, ...props }: EmptyProps) {
  return (
    <BaseAutocomplete.Empty
      ref={ref}
      className={cn(styles.empty(), className)}
      data-slot="autocomplete-empty"
      {...props}
    />
  )
}

Empty.displayName = "AutocompleteEmpty"

export type GroupProps = ComponentProps<typeof BaseAutocomplete.Group>

export function Group({ className, ref, ...props }: GroupProps) {
  return (
    <BaseAutocomplete.Group
      ref={ref}
      className={cn(styles.group(), className)}
      data-slot="autocomplete-group"
      {...props}
    />
  )
}

Group.displayName = "AutocompleteGroup"

export type GroupLabelProps = ComponentProps<typeof BaseAutocomplete.GroupLabel>

export function GroupLabel({ className, ref, ...props }: GroupLabelProps) {
  return (
    <BaseAutocomplete.GroupLabel
      ref={ref}
      className={cn(styles.groupLabel(), className)}
      data-slot="autocomplete-group-label"
      {...props}
    />
  )
}

GroupLabel.displayName = "AutocompleteGroupLabel"

export type SeparatorProps = ComponentProps<typeof BaseAutocomplete.Separator>

export function Separator({ className, ref, ...props }: SeparatorProps) {
  return (
    <BaseAutocomplete.Separator
      ref={ref}
      className={cn(styles.separator(), className)}
      data-slot="autocomplete-separator"
      {...props}
    />
  )
}

Separator.displayName = "AutocompleteSeparator"
