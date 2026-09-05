/* eslint-disable @next/next/no-img-element */

/**
 * A plain `<img>`, standing in for `next/image`.
 *
 * `next/image` writes `color: transparent` onto every image it renders, and an
 * inline style is the one thing a missing stylesheet cannot undo — which is the
 * whole conceit of this branch. It also sizes itself through CSS, and there is
 * none.
 *
 * So: the attributes, the way a document did it before either existed. `width`
 * and `height` on the tag, `alt` where it belongs, and the props that only meant
 * something to the optimiser dropped on the floor.
 */
type PlainImageProps = {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  /** Accepted and ignored — `next/image` API surface that has no meaning here. */
  priority?: boolean
  sizes?: string
  quality?: number
  unoptimized?: boolean
  fill?: boolean
  placeholder?: string
  blurDataURL?: string
  loading?: 'lazy' | 'eager'
}

export default function PlainImage({
  src,
  alt,
  width,
  height,
  className,
  loading,
  fill,
}: PlainImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      // A filled image has no intrinsic box of its own to declare.
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      loading={loading}
    />
  )
}
