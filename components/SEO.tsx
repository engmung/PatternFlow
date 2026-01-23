import React from 'react';
import { useLanguage } from '../src/context/LanguageContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image = 'https://patternflow.work/og-image.jpg',
  url = 'https://patternflow.work'
}) => {
  const { language } = useLanguage();

  const siteTitle = "Patternflow";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  return (
    <>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Language Alternates (Simple implementation) */}
      <html lang={language} />
    </>
  );
};

export default SEO;
