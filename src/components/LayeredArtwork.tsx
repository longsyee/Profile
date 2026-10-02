import type { SVGProps } from 'react'

export type ArtworkCutout = {
  id: string
  path: string
  center: [number, number]
}

type LayeredArtworkProps = {
  src: string
  viewBox: string
  width: number
  height: number
  id: string
  cutouts: ArtworkCutout[]
  className?: string
  svgProps?: SVGProps<SVGSVGElement>
}

/** Renders the source art once as a clean base, then reuses its exact pixels
 *  as individually clipped, transparent layers for independent GSAP motion. */
export function LayeredArtwork({
  src,
  viewBox,
  width,
  height,
  id,
  cutouts,
  className,
  svgProps,
}: LayeredArtworkProps) {
  const maskId = `${id}-base-mask`

  return (
    <svg
      {...svgProps}
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      data-layered-artwork
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
          <rect width={width} height={height} fill="white" />
          {cutouts.map((cutout) => <path key={cutout.id} d={cutout.path} fill="black" />)}
        </mask>
        {cutouts.map((cutout) => (
          <clipPath key={cutout.id} id={`${id}-${cutout.id}-clip`} clipPathUnits="userSpaceOnUse">
            <path d={cutout.path} />
          </clipPath>
        ))}
      </defs>

      <image href={src} x="0" y="0" width={width} height={height} mask={`url(#${maskId})`} />
      {cutouts.map((cutout) => (
        <g
          key={cutout.id}
          className="layeredArtworkShard"
          data-shard
          data-shard-id={cutout.id}
          clipPath={`url(#${id}-${cutout.id}-clip)`}
          transform-origin={`${cutout.center[0]}px ${cutout.center[1]}px`}
          style={{ transformBox: 'view-box' }}
        >
          <image href={src} x="0" y="0" width={width} height={height} />
        </g>
      ))}
    </svg>
  )
}
