export interface Manifest {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  default_locale?: string;
  permissions?: string[];
  host_permissions?: string[];
  background?: {
    service_worker: string;
    type?: 'module';
  };
  content_scripts?: Array<{
    matches: string[];
    js?: string[];
    css?: string[];
    run_at?: 'document_start' | 'document_end' | 'document_idle';
  }>;
  action?: {
    default_popup?: string;
    default_title?: string;
    default_icon?: Record<string, string>;
  };
  icons?: Record<string, string>;
  homepage_url?: string;
  author?: string;
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[YTClipper Extension] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[YTClipper Extension] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[YTClipper Extension] ${message}`, ...args);
  },
};
