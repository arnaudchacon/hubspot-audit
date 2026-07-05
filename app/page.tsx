import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ChecksGrid } from '@/components/landing/ChecksGrid';
import { ReviewFeature } from '@/components/landing/ReviewFeature';
import { RecentAudits } from '@/components/landing/RecentAudits';

export default function Home() {
  return (
    <main className="min-h-screen bg-bg">
      <Hero />
      <HowItWorks />
      <ChecksGrid />
      <ReviewFeature />
      <RecentAudits />
    </main>
  );
}
