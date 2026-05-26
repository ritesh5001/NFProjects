import { WebsiteCategory, WebsitePlatform } from '../types';

export const WEBSITE_CATEGORY_OPTIONS: { value: WebsiteCategory; label: string }[] = [
  { value: 'ecommerce', label: 'Ecommerce' },
  { value: 'service', label: 'Service' },
  { value: 'other', label: 'Other' },
];

export const WEBSITE_PLATFORM_OPTIONS: { value: WebsitePlatform; label: string }[] = [
  { value: 'wordpress', label: 'WordPress' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'custom_code', label: 'Coding' },
  { value: 'other', label: 'Other' },
];

export const WEBSITE_CATEGORY_LABELS: Record<WebsiteCategory, string> = {
  ecommerce: 'Ecommerce',
  service: 'Service',
  other: 'Other',
};

export const WEBSITE_PLATFORM_LABELS: Record<WebsitePlatform, string> = {
  wordpress: 'WordPress',
  shopify: 'Shopify',
  custom_code: 'Coding website',
  other: 'Other',
};

const CHECKLISTS: Record<WebsiteCategory, string[]> = {
  ecommerce: [
    'Homepage',
    'Product pages',
    'Category pages',
    'Cart page',
    'Checkout page',
    'Payment gateway',
    'Policy pages',
    'Shipping / Shiprocket setup',
    'Header and footer',
    'Mobile responsive check',
  ],
  service: [
    'Homepage',
    'Service pages',
    'About page',
    'Contact form',
    'Policy pages',
    'Header and footer',
    'Mobile responsive check',
  ],
  other: [
    'Homepage',
    'Inner pages',
    'Header and footer',
    'Policy pages',
    'Final testing',
  ],
};

export function getWebsiteChecklist(category: WebsiteCategory) {
  return CHECKLISTS[category];
}
