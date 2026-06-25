export async function DevelopmentTools() {
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const { MockControlPanel } = await import("@/mocks/ui/mock-control-panel")

  return <MockControlPanel />
}
