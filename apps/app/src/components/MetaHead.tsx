import React from 'react';
import { Helmet } from 'react-helmet-async';
import { type MetadataConfig, defaultMetadata } from '../lib/metadata';

interface MetaHeadProps extends MetadataConfig {
  children?: React.ReactNode;
}

export const MetaHead: React.FC<MetaHeadProps> = ({
  title,
  description,
  keywords,
  author,
  image,
  url,
  type = 'website',
  siteName,
  locale = 'en_US',
  twitterCard = 'summary_large_image',
  twitterSite,
  twitterCreator,
  children,
}) => {
  const config = {
    title: title || defaultMetadata.title,
    description: description || defaultMetadata.description,
    keywords: keywords || defaultMetadata.keywords,
    author: author || defaultMetadata.author,
    image: image || defaultMetadata.image,
    url: url || defaultMetadata.url,
    type,
    siteName: siteName || defaultMetadata.siteName,
    locale,
    twitterCard,
    twitterSite: twitterSite || defaultMetadata.twitterSite,
    twitterCreator: twitterCreator || defaultMetadata.twitterCreator,
  };

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{config.title}</title>
      <meta name='description' content={config.description} />
      {config.keywords ? (
        <meta name='keywords' content={config.keywords.join(', ')} />
      ) : null}
      {config.author ? <meta name='author' content={config.author} /> : null}
      <meta name='robots' content='index, follow' />
      <meta name='viewport' content='width=device-width, initial-scale=1.0' />

      {/* Open Graph */}
      <meta property='og:title' content={config.title} />
      <meta property='og:description' content={config.description} />
      <meta property='og:type' content={config.type} />
      {config.image ? (
        <meta property='og:image' content={config.image} />
      ) : null}
      {config.url ? <meta property='og:url' content={config.url} /> : null}
      {config.siteName ? (
        <meta property='og:site_name' content={config.siteName} />
      ) : null}
      <meta property='og:locale' content={config.locale} />

      {/* Twitter Cards */}
      <meta name='twitter:card' content={config.twitterCard} />
      <meta name='twitter:title' content={config.title} />
      <meta name='twitter:description' content={config.description} />
      {config.image ? (
        <meta name='twitter:image' content={config.image} />
      ) : null}
      {config.twitterSite ? (
        <meta name='twitter:site' content={config.twitterSite} />
      ) : null}
      {config.twitterCreator ? (
        <meta name='twitter:creator' content={config.twitterCreator} />
      ) : null}

      {/* Additional meta tags */}
      <meta name='theme-color' content='#3b82f6' />
      <meta name='msapplication-TileColor' content='#3b82f6' />
      {config.url ? <link rel='canonical' href={config.url} /> : null}

      {/* Favicon */}
      <link rel='icon' type='image/svg+xml' href='/vite.svg' />
      <link rel='icon' type='image/png' href='/favicon.png' />

      {/* Additional children */}
      {children}
    </Helmet>
  );
};
