import Nav from '../components/landing/Nav';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Pricing from '../components/landing/Pricing';
import Faq from '../components/landing/Faq';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';
import Maker from '../components/landing/Maker';

export const HomePage = () => {
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
};
