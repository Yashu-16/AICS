export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base':    '#0a0a0f',
        'bg-surface': '#0f0f17',
        'bg-card':    '#13131e',
      },
      fontFamily: {
        head: ['Syne', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}