'use client';

import Nav from '../components/Nav';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Pricing from '../components/Pricing';
import Faq from '../components/Faq';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import Maker from '../components/Maker';

export default function Home() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden font-poppins'>
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <Maker />
      <Faq />
      <Contact />
      <Footer />
    </main>
  );
}
