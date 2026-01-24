/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-fg)',
        },
        background: 'var(--color-background)',
        'card-background': 'var(--color-card-background)',
        foreground: 'var(--color-foreground)',
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-fg)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-fg)',
        },
        accent: 'var(--color-accent)',
        border: 'var(--color-border)',
        destructive: 'var(--color-destructive)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        'code-bg': 'var(--color-code-bg)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glow-primary': 'var(--glow-primary)',
      },
      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'base': 'var(--space-base)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
        '4xl': 'var(--space-4xl)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'base': 'var(--radius-base)',
        'lg': 'var(--radius-lg)',
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'base': 'var(--transition-base)',
        'slow': 'var(--transition-slow)',
      },
    },
  },
  plugins: [],
}
