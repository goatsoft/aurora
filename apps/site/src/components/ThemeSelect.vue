<script setup lang="ts">
import { useSitePreferences } from '@/lib/preferences'

const { theme, setTheme } = useSitePreferences()
</script>

<template>
  <label
    class="relative grid size-11 place-items-center rounded-full focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring hover:bg-accent [&_svg]:size-5"
    :title="`Colour theme: ${theme}`"
  >
    <span class="sr-only">Colour theme</span>
    <select
      v-model="theme"
      aria-label="Colour theme"
      class="absolute inset-0 size-full cursor-pointer opacity-0"
      @change="setTheme(theme)"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
    <IHgComputer
      v-if="theme === 'system'"
      aria-hidden="true"
    />
    <IHgSun03
      v-else-if="theme === 'light'"
      aria-hidden="true"
    />
    <IHgMoon02
      v-else
      aria-hidden="true"
    />
  </label>
</template>
