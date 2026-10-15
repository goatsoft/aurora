import type { Directive } from 'vue'

/**
 * `v-reveal`: content rises into place as it scrolls into view. It's in the HTML from the start
 * (prerendered, readable without JavaScript); only content still below the fold when the page
 * hydrates waits to be revealed. Reduced motion skips it. `v-reveal:tilt` also tips it back and
 * scales it up as it rises, for a big picture.
 */
export const reveal: Directive<HTMLElement, number | undefined, string, 'tilt'> = {
  mounted(el, binding) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset['paused'] === 'true') return
    if (el.getBoundingClientRect().top < innerHeight * 0.9) return
    const tilt = binding.arg === 'tilt'
    el.style.opacity = '0'
    el.style.transform = tilt ? 'perspective(1600px) translateY(64px) rotateX(18deg) scale(0.94)' : 'translateY(24px)'
    if (tilt) el.style.transformOrigin = '50% 0'
    const delay = binding.value ?? 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      const ms = tilt ? 1100 : 900
      el.style.transition = `opacity 700ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${ms}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`
      el.style.opacity = ''
      el.style.transform = ''
    }, { rootMargin: '0px 0px -10% 0px' })
    observer.observe(el)
  },
}
