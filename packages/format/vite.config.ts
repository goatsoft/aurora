import { defineConfig } from 'vite'
import { libraryConfig } from '../../vite.library.ts'

export default defineConfig(libraryConfig(import.meta.dirname))
