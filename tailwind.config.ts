import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'startup-primary': '#6366F1',
        'startup-primary-dark': '#4F46E5',
        'startup-secondary': '#8B5CF6',
        'startup-accent': '#EC4899',
        'startup-success': '#10B981',
        'startup-warning': '#F59E0B',
        'startup-danger': '#EF4444',
        'startup-dark': '#1E1B4B',
        'startup-light': '#F5F3FF',
        'startup-gray': '#64748B',
        'startup-card': '#FFFFFF',
        'startup-border': '#E2E8F0',
        
        'monet-primary': '#6366F1',
        'monet-secondary': '#8B5CF6',
        'monet-accent': '#F5F3FF',
        'monet-shadow': '#1E1B4B',
        'monet-highlight': '#EF4444',
        'monet-warm': '#F59E0B',
        'monet-cool': '#8B5CF6',
        'monet-light': '#F5F3FF',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'startup': '0 4px 20px -2px rgba(99, 102, 241, 0.15)',
        'startup-lg': '0 10px 40px -3px rgba(99, 102, 241, 0.2)',
        'startup-xl': '0 20px 50px -5px rgba(99, 102, 241, 0.25)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'pulse-glow': 'pulse-glow 3s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backgroundImage: {
        'gradient-startup': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-startup-light': 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #FDF4FF 100%)',
        'gradient-card': 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
export default config;
