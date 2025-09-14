// tailwind.config.ts
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors:{
        primary:'var(--primary)',
        secondary:'var(--secondary)',
        success:'var(--success)',
        warning:'var(--warning)',
        error:'var(--error)',
        info:'var(--info)',
        surface:'var(--surface)',
        ink:'var(--text)',
        muted:'var(--muted)',
        border:'var(--border)',
      },
      borderRadius:{ '2xl':'var(--radius)' }
    }
  },
  plugins:[]
}
export default config
