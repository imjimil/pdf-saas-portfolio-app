import { AppShell } from '../components/AppShell';
import { Footer } from '../components/Footer';
import { Hero } from '../components/landing/Hero';
import { ToolGrid } from '../components/landing/ToolGrid';
import { Steps } from '../components/landing/Steps';
import { Privacy } from '../components/landing/Privacy';
import { FAQ } from '../components/landing/FAQ';
import { CTA } from '../components/landing/CTA';

export default function Landing() {
  return (
    <AppShell footer={<Footer />}>
      <Hero />
      <div className="section-band">
        <ToolGrid />
      </div>
      <Steps />
      <div className="section-band">
        <Privacy />
      </div>
      <FAQ />
      <CTA />
    </AppShell>
  );
}
