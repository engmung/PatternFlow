import React from 'react';
import { Instagram } from 'lucide-react';
import { INSTAGRAM_URL } from '../constants';
import { useLanguage } from '../src/context/LanguageContext';

interface GalleryItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
}

const galleryItems: GalleryItem[] = [
  {
    type: 'image',
    src: '/imgs/1.png',
    alt: 'PatternFlow 3D artwork 1'
  },
  {
    type: 'image',
    src: '/imgs/2.png',
    alt: 'PatternFlow 3D artwork 2'
  },
  {
    type: 'image',
    src: '/imgs/3.png',
    alt: 'PatternFlow 3D artwork 3'
  }
];

const CollectionGallery: React.FC = () => {
  return (
    <section className="w-full bg-black">
      


    </section>
  );
};

export default CollectionGallery;