import { notFound } from "next/navigation"
import { isStorePath } from "@/lib/navigation"

export default async function Page({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  if (!isStorePath(`/${path.join("/")}`)) notFound()
  return null
}
