import Contact from '../components/landing/Contact';
import Faq from '../components/landing/Faq';
import Features from '../components/landing/Features';
import Footer from '../components/landing/Footer';
import Hero from '../components/landing/Hero';
import Maker from '../components/landing/Maker';
import Nav from '../components/landing/Nav';
import Pricing from '../components/landing/Pricing';

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
