import { AudienceSection } from "@/components/audience-section";
import { BenefitsSection } from "@/components/benefits-section";
import { ColorShowcase } from "@/components/color-showcase";
import { FAQSection } from "@/components/faq-section";
import { FeatureGrid } from "@/components/feature-grid";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { LandingComparison } from "@/components/landing-comparison";
import { PrivacySummary } from "@/components/privacy-summary";
import { ProposalShowcase } from "@/components/proposal-showcase";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export default function Home() {
  return (
    <>
      <a
        href="#contenido"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-md bg-[var(--graphite)] px-4 py-2 text-sm font-bold text-white transition focus:translate-y-0"
      >
        Saltar al contenido
      </a>
      <PublicHeader />
      <main id="contenido">
        <HeroSection />
        <HowItWorks />
        <FeatureGrid />
        <ColorShowcase />
        <LandingComparison />
        <ProposalShowcase />
        <BenefitsSection />
        <AudienceSection />
        <FAQSection />
        <PrivacySummary />
      </main>
      <PublicFooter />
    </>
  );
}
