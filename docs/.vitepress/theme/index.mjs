import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import mediumZoom from 'medium-zoom'
import './style.css'

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute()
    let zoom

    const attachZoom = async () => {
      await nextTick()
      zoom.detach()
      zoom.attach('.vp-doc img:not(a img):not(.no-zoom)')
      for (const image of zoom.getImages()) {
        image.tabIndex = 0
        image.setAttribute('role', 'button')
        image.setAttribute('aria-label', `放大图片：${image.alt || '图片'}`)
        image.onkeydown = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            zoom.open({ target: image })
          }
        }
      }
    }

    onMounted(() => {
      zoom = mediumZoom({ background: 'var(--vp-c-bg)', margin: 24 })
      attachZoom()
    })
    watch(() => route.path, attachZoom, { flush: 'post' })
    onUnmounted(() => zoom?.detach())
  }
}
