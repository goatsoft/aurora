<script setup>
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { AuroraBadge } from '@goatsoft/aurora-vue/badge'
import hero from './hero.aurora'
</script>

<template>
  <section style="position: relative; height: 100vh">
    <AuroraBackground :src="hero" />
    <AuroraBadge />
  </section>
</template>
