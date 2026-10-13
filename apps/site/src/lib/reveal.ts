import type { Directive } from 'vue'

/**
 * `v-reveal`: content rises into place as it scrolls into view. It's in the HTML from the start
 * (prerendered, readable without JavaScript); only content still below the fold when the page
 * hydrates waits to be revealed. Reduced motion skips it.
 */
export const reveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < innerHeight * 0.9) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'
    const delay = binding.value ?? 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      el.style.transition = `opacity 700ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 900ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`
      el.style.opacity = ''
      el.style.transform = ''
    }, { rootMargin: '0px 0px -10% 0px' })
    observer.observe(el)
  },
}
