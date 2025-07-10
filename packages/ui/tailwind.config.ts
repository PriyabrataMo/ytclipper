import baseConfig from '@ytclipper/tailwind-config';
import type { Config } from 'tailwindcss';

const config: Config = {
  ...baseConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../apps/app/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../apps/extension/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};

export default config;
