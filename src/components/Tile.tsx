import { BOARD_PADDING, CELL_GAP, CELL_SIZE } from "../game/constants"
import type { Tile as TileType } from "../game/types"

type TileProps = {
  tile: TileType
}

// Pixel offset of a cell index along one axis.
function offset(index: number): number {
  return BOARD_PADDING + index * (CELL_SIZE + CELL_GAP)
}

/**
 * A single numbered tile. pos absolete, moved with a CSS transform
 * so position changes animate as a slide. Spawn and merge flags toggle the
 * matching keyframe animations.
 */
export function Tile({ tile }: TileProps) {
  const x = offset(tile.col)
  const y = offset(tile.row)

  const classNames = [
    "tile",
    `tile--${tile.value}`,
    tile.isNew ? "tile--new" : "",
    tile.hasMerged ? "tile--merged" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classNames} style={{ transform: `translate(${x}px, ${y}px)` }}>
      <span className="tile__value">{tile.value}</span>
    </div>
  )
}

export function TileShadow({ tile }: TileProps) {
  const x = offset(tile.col)
  const y = offset(tile.row)

  return <div className="tile-shadow" style={{ transform: `translate(${x}px, ${y}px)` }} />
}
