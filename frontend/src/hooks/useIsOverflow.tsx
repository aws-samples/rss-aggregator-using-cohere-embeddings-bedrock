import * as React from 'react'

export const useIsOverflow = (
  ref: React.RefObject<any>,
  callback?: (hasOverflow: boolean) => void
) => {
  const [isOverflow, setIsOverflow] = React.useState(false)
  const { current } = ref;

  React.useLayoutEffect(() => {
    const trigger = (current: any) => {
      const hasOverflow = current!.scrollWidth > current!.clientWidth
      setIsOverflow(hasOverflow)
      callback?.call(this, hasOverflow)
    }

    if (current) {
      if ('ResizeObserver' in window) {
        new ResizeObserver(() => setTimeout(() => trigger(current), 500)).observe(current)
      }

      trigger(current)
    }
  }, [callback, ref, current])

  return isOverflow
}
