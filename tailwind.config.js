/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pb: {
          // Sampled from the PowerBase "P" mark supplied for this redesign.
          green: {
            DEFAULT: '#0E9E28',
            dark: '#0B7A1F',
            darker: '#075614',
            light: '#E6F6E9',
            tint: '#F2FBF3',
          },
          navy: {
            DEFAULT: '#12202B',
            soft: '#1E323F',
          },
          gray: {
            bg: '#F5F6F7',
            surface: '#FFFFFF',
            border: '#E3E6E8',
            text: '#171A1C',
            muted: '#6B7378',
          },
          amber: '#C9781A',
          red: '#C4321F',
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
        card: '10px',
        sm: '6px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.05)',
        panel: '0 4px 16px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
}
