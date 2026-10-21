/** @type {import('tailwindcss').Config} */
// As cores apontam para variáveis CSS (definidas em src/style.css), então trocar de tema
// não exige nenhuma classe condicional nos componentes.
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg)',
        surface: 'var(--surface)',
        soft: 'var(--surface-soft)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        line: 'var(--border)',
        accent: 'var(--accent)',
        'accent-dark': 'var(--accent-dark)',
        'accent-soft': 'var(--accent-soft)',
        'on-accent': 'var(--on-accent)',
        support: 'var(--support)',
        'support-dark': 'var(--support-dark)',
        success: 'var(--success)',
        'success-dark': 'var(--success-dark)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        featured: 'var(--featured-bg)',
        'featured-text': 'var(--featured-text)',
      },
      fontFamily: {
        sans: ['"Trebuchet MS"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        serif: ['Georgia', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        card: 'var(--shadow)',
      },
      keyframes: {
        'rise-in': { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(10px) scale(.97)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
      },
      animation: {
        'rise-in': 'rise-in .5s ease both',
        'fade-in': 'fade-in .2s ease both',
        'pop-in': 'pop-in .3s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
}
