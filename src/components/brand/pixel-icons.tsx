import type { SVGProps } from "react"

type Props = SVGProps<SVGSVGElement>

const base: Props = {
  shapeRendering: "crispEdges",
  "aria-hidden": true,
  fill: "currentColor",
}

export function IconChat(props: Props) {
  return (
    <svg viewBox="0 0 8 8" {...base} {...props}>
      <rect x="0" y="0" width="8" height="5" />
      <rect x="1" y="5" width="2" height="1" />
      <rect x="1" y="6" width="1" height="1" />
    </svg>
  )
}

export function IconDashboard(props: Props) {
  return (
    <svg viewBox="0 0 7 7" {...base} {...props}>
      <rect x="0" y="0" width="3" height="3" />
      <rect x="4" y="0" width="3" height="3" />
      <rect x="0" y="4" width="3" height="3" />
      <rect x="4" y="4" width="3" height="3" />
    </svg>
  )
}

export function IconFinancas(props: Props) {
  return (
    <svg viewBox="0 0 7 7" {...base} {...props}>
      <rect x="1" y="0" width="5" height="1" />
      <rect x="0" y="1" width="1" height="5" />
      <rect x="6" y="1" width="1" height="5" />
      <rect x="1" y="6" width="5" height="1" />
      <rect x="3" y="2" width="1" height="3" />
    </svg>
  )
}

export function IconNotas(props: Props) {
  return (
    <svg viewBox="0 0 7 7" {...base} {...props}>
      <rect x="0" y="0" width="7" height="1" />
      <rect x="0" y="3" width="6" height="1" />
      <rect x="0" y="6" width="4" height="1" />
    </svg>
  )
}

export function IconFavoritos(props: Props) {
  return (
    <svg viewBox="0 0 7 7" {...base} {...props}>
      <rect x="3" y="0" width="1" height="7" />
      <rect x="0" y="2" width="7" height="1" />
      <rect x="1" y="1" width="5" height="1" />
      <rect x="1" y="4" width="2" height="2" />
      <rect x="4" y="4" width="2" height="2" />
    </svg>
  )
}

export function IconKanban(props: Props) {
  return (
    <svg viewBox="0 0 7 7" {...base} {...props}>
      <rect x="0" y="0" width="1" height="7" />
      <rect x="3" y="0" width="1" height="5" />
      <rect x="6" y="0" width="1" height="7" />
    </svg>
  )
}

export function IconSQL(props: Props) {
  return (
    <svg viewBox="0 0 7 7" {...base} {...props}>
      <rect x="1" y="0" width="5" height="1" />
      <rect x="0" y="1" width="1" height="2" />
      <rect x="6" y="1" width="1" height="2" />
      <rect x="1" y="3" width="5" height="1" />
      <rect x="0" y="4" width="1" height="2" />
      <rect x="6" y="4" width="1" height="2" />
      <rect x="1" y="6" width="5" height="1" />
    </svg>
  )
}

export function IconLinks(props: Props) {
  return (
    <svg viewBox="0 0 7 7" {...base} {...props}>
      <rect x="0" y="1" width="3" height="1" />
      <rect x="0" y="2" width="1" height="2" />
      <rect x="2" y="2" width="3" height="1" />
      <rect x="4" y="3" width="3" height="1" />
      <rect x="6" y="4" width="1" height="2" />
      <rect x="4" y="5" width="3" height="1" />
    </svg>
  )
}

export function IconSettings(props: Props) {
  return (
    <svg viewBox="0 0 7 7" {...base} {...props}>
      <rect x="2" y="0" width="3" height="1" />
      <rect x="0" y="2" width="7" height="3" />
      <rect x="2" y="6" width="3" height="1" />
    </svg>
  )
}

export function IconCheck(props: Props) {
  return (
    <svg viewBox="0 0 7 7" {...base} {...props}>
      <rect x="0" y="3" width="2" height="2" />
      <rect x="2" y="5" width="2" height="2" />
      <rect x="4" y="2" width="2" height="2" />
      <rect x="5" y="0" width="2" height="2" />
    </svg>
  )
}
