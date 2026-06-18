import { GRID_SIZE } from "../game/constants"

export function GridCell() {
  return <div className="grid-cell" />
}

export function GridBackground() {
  const cellCount = GRID_SIZE * GRID_SIZE
  return (
    <div className="grid-background" aria-hidden="true">
      {Array.from({ length: cellCount }, (_, index) => (
        <GridCell key={index} />
      ))}
    </div>
  )
}
