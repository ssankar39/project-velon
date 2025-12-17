/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff4513',
        'dark-bg': '#141414',
        'rich-black': '#141A1F',
        'deep-black': '#030609',
        'silver-gray': '#ABABAB',
        'sonic-silver': '#767E86',
        'cadet-gray': '#919EAB',
        'gainsboro': '#E0E0E0',
      },
      fontFamily: {
        catamaran: ['Catamaran', 'sans-serif'],
        rubik: ['Rubik', 'sans-serif'],
      },
      fontSize: {
        'hero': '3.8rem',
        'fs-1': '3.8rem',
        'fs-2': '3rem',
        'fs-3': '2.5rem',
        'fs-4': '2rem',
        'fs-5': '1.8rem',
        'fs-6': '1.5rem',
        'h2': '3rem',
        'h3': '2rem',
      },
      spacing: {
        'section': '80px',
      },
      borderRadius: {
        'card': '10px',
      },
      boxShadow: {
        'card': '0 0 20px rgba(0,0,0,0.1)',
        'primary': '0 10px 24px rgba(255,69,19,0.2)',
        'primary-hover': '0 15px 30px rgba(255,69,19,0.3)',
      },
      animation: {
        'spin-slow': 'spin 30s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'slideIn': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,69,19,0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(255,69,19,0.5)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #ff4513 0%, #ff6b3d 100%)',
      },
    },
  },
  plugins: [],
}
