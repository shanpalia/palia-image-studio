/**
 * Palia Image Studio - Curated Sample Images
 * High-quality royalty-free demo images for instant testing
 * By Hafsa Traders
 */

export interface SampleImageItem {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  url: string;
}

export const SAMPLE_IMAGES: SampleImageItem[] = [
  {
    id: 'sample-portrait',
    title: 'Studio Portrait',
    category: 'People',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'sample-product',
    title: 'Sneaker Product',
    category: 'E-Commerce',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'sample-watch',
    title: 'Luxury Watch',
    category: 'Jewelry & Gear',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'sample-car',
    title: 'Modern Sports Car',
    category: 'Automotive',
    thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85',
  },
];
