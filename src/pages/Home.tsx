import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsRibbon } from '@/components/landing/StatsRibbon';
import { ProgramsSection } from '@/components/landing/ProgramsSection';
import { WhyChooseUsSection } from '@/components/landing/WhyChooseUsSection';
import { TestimonialAndCtaBanner } from '@/components/landing/TestimonialAndCtaBanner';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Header / Navbar */}
      <LandingNavbar />

      {/* Main Page Flow */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Stats Ribbon */}
        <StatsRibbon />

        {/* 4. Programs Section */}
        <ProgramsSection />

        {/* 5. Why Choose Us Section */}
        <WhyChooseUsSection />

        {/* 6. Testimonial & Final CTA Banner */}
        <TestimonialAndCtaBanner />
      </main>

      {/* 7. Footer */}
      <LandingFooter />
    </div>
  );
}
