/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pb: {
          green: {
            DEFAULT: '#1B7A3D',
            dark: '#0F4C24',
            darker: '#0A331A',
            light: '#E8F5EC',
          },
          gray: {
            bg: '#F7F8FA',
            border: '#E6E8EB',
            text: '#1A1D1F',
            muted: '#6B7280',
          },
          amber: '#F5A623',
          red: '#E0392B',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        panel: '0 2px 8px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
}
