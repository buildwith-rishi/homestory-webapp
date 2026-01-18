/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#DC5800',
        secondary: '#321300',
        background: '#FFFFFF',
        ash: '#C2C5BB',
        olive: '#7A7F4D',
        rose: '#D08C7A',
        teal: '#0F5257',
        burgundy: '#650D1B',
      },
      fontFamily: {
        display: ['NeueHaas Grotesk Display Pro', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['Inter Tight', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['48px', { lineHeight: '0.9' }],
        'display-lg': ['36px', { lineHeight: '0.9' }],
        'display-md': ['28px', { lineHeight: '0.9' }],
        'display-sm': ['24px', { lineHeight: '0.9' }],
        'body-lg': ['18px', { lineHeight: '1.1' }],
        'body': ['16px', { lineHeight: '1.1' }],
        'body-sm': ['14px', { lineHeight: '1.1' }],
        'caption': ['12px', { lineHeight: '1.1' }],
      },
      spacing: {
        '18': '72px',
        '22': '88px',
        '30': '120px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'brand-sm': '0 1px 2px rgba(50, 19, 0, 0.05)',
        'brand-md': '0 4px 8px rgba(50, 19, 0, 0.08)',
        'brand-lg': '0 8px 24px rgba(50, 19, 0, 0.12)',
        'brand-xl': '0 16px 48px rgba(50, 19, 0, 0.16)',
      },
    },
  },
  plugins: [],
};
