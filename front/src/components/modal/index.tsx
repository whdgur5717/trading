"use client"

import { cn } from "@/utils/cn"
import { X } from "lucide-react"
import { Dialog } from "radix-ui"
import type { ComponentProps } from "react"

import { modal } from "./styles"

const styles = modal()

export type ModalRootProps = ComponentProps<typeof Dialog.Root>
export type ModalTriggerProps = ComponentProps<typeof Dialog.Trigger>

export const Root = Dialog.Root
export const Trigger = Dialog.Trigger
export const Portal = Dialog.Portal
export const Close = Dialog.Close

export type ModalOverlayProps = ComponentProps<typeof Dialog.Overlay>

export function Overlay({ className, ref, ...props }: ModalOverlayProps) {
  return (
    <Dialog.Overlay
      ref={ref}
      className={cn(styles.overlay(), className)}
      data-slot="modal-overlay"
      {...props}
    />
  )
}

Overlay.displayName = "ModalOverlay"

export type ModalContentProps = ComponentProps<typeof Dialog.Content>

export function Content({
  children,
  className,
  ref,
  ...props
}: ModalContentProps) {
  return (
    <Dialog.Portal>
      <Overlay />
      <Dialog.Content
        ref={ref}
        className={cn(styles.content(), className)}
        data-slot="modal-content"
        {...props}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

Content.displayName = "ModalContent"

export type ModalHeaderProps = ComponentProps<"div">

export function Header({ className, ref, ...props }: ModalHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn(styles.header(), className)}
      data-slot="modal-header"
      {...props}
    />
  )
}

Header.displayName = "ModalHeader"

export type ModalTitleProps = ComponentProps<typeof Dialog.Title>

export function Title({ className, ref, ...props }: ModalTitleProps) {
  return (
    <Dialog.Title
      ref={ref}
      className={cn(styles.title(), className)}
      data-slot="modal-title"
      {...props}
    />
  )
}

Title.displayName = "ModalTitle"

export type ModalDescriptionProps = ComponentProps<typeof Dialog.Description>

export function Description({
  className,
  ref,
  ...props
}: ModalDescriptionProps) {
  return (
    <Dialog.Description
      ref={ref}
      className={cn(styles.description(), className)}
      data-slot="modal-description"
      {...props}
    />
  )
}

Description.displayName = "ModalDescription"

export type ModalBodyProps = ComponentProps<"div">

export function Body({ className, ref, ...props }: ModalBodyProps) {
  return (
    <div
      ref={ref}
      className={cn(styles.body(), className)}
      data-slot="modal-body"
      {...props}
    />
  )
}

Body.displayName = "ModalBody"

export type ModalFooterProps = ComponentProps<"div">

export function Footer({ className, ref, ...props }: ModalFooterProps) {
  return (
    <div
      ref={ref}
      className={cn(styles.footer(), className)}
      data-slot="modal-footer"
      {...props}
    />
  )
}

Footer.displayName = "ModalFooter"

export type ModalCloseProps = ComponentProps<typeof Dialog.Close>

export type ModalCloseButtonProps = Omit<ModalCloseProps, "children"> & {
  label?: string
}

export function CloseButton({
  className,
  label = "닫기",
  ref,
  ...props
}: ModalCloseButtonProps) {
  return (
    <Dialog.Close
      ref={ref}
      aria-label={label}
      className={cn(styles.closeButton(), className)}
      data-slot="modal-close-button"
      {...props}
    >
      <X aria-hidden="true" />
    </Dialog.Close>
  )
}

CloseButton.displayName = "ModalCloseButton"
