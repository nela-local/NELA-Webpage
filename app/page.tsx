'use client';

import { useScroll } from 'motion/react';
import NeuralBackground from '@/components/NeuralBackground';
import Hero from '@/components/Hero';
import OwnerJobs from '@/components/OwnerJobs';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import AlsoInWorkspace from '@/components/AlsoInWorkspace';
import PricingStrip from '@/components/PricingStrip';
import Footer from '@/components/Footer';

export default function Home() {
  const { scrollYProgress } = useScroll();

  return (
    <main className="relative min-h-screen bg-transparent overflow-hidden">
      <NeuralBackground scrollYProgress={scrollYProgress} />

      <div className="relative z-10">
        <Hero />
        <OwnerJobs />
        <HowItWorks />
        <Features />
        <AlsoInWorkspace />
        <PricingStrip />
        <Footer />
      </div>
    </main>
  );
}
