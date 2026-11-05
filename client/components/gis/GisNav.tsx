import Link from "next/link"
import { Map, Layers, Boxes, PanelLeft, ListTree } from "lucide-react"

export function GisNav() {
  return (
    <div className="flex items-center gap-1 border-b px-3 py-1.5 text-sm">
      <Link href="/" className="mr-2 flex items-center gap-1.5 font-semibold text-foreground/80 hover:text-foreground">
        <PanelLeft className="h-3.5 w-3.5" />
        Atlas
      </Link>
      <NavLink href="/gis/projects" label="Processing Projects" icon={<Boxes className="h-3.5 w-3.5" />} />
      <NavLink href="/gis/map" label="Map Viewer" icon={<Map className="h-3.5 w-3.5" />} />
      <NavLink href="/gis/polygons" label="Acquisition Polygons" icon={<Layers className="h-3.5 w-3.5" />} />
      <NavLink href="/gis/audit" label="Audit History" icon={<ListTree className="h-3.5 w-3.5" />} />
    </div>
  )
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {icon}
      {label}
    </Link>
  )
}
