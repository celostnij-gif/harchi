import Navbar from "@/components/kharchi/Navbar";
import Hero from "@/components/kharchi/Hero";
import Ticker from "@/components/kharchi/Ticker";
import Stats from "@/components/kharchi/Stats";
import Catalog from "@/components/kharchi/Catalog";
import XlBanner from "@/components/kharchi/XlBanner";
import KitsSection from "@/components/kharchi/KitsSection";
import HowItWorks from "@/components/kharchi/HowItWorks";
import Reviews from "@/components/kharchi/Reviews";
import Faq from "@/components/kharchi/Faq";
import CtaBanner from "@/components/kharchi/CtaBanner";
import Footer from "@/components/kharchi/Footer";
import CartDrawer from "@/components/kharchi/CartDrawer";
import { getSiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getSiteData();
  /** Секція рендериться лише якщо visibility.<key> !== false (default true) */
  const vis = (key: string) => data.visibility[key] !== false;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {vis("hero") && <Hero heroBg={data.heroBg} />}
        {vis("ticker") && <Ticker />}
        {vis("stats") && <Stats />}
        {vis("catalog") && (
          <Catalog products={data.products} categories={data.categories} />
        )}
        {vis("xl") && <XlBanner />}
        {vis("kits") && <KitsSection kits={data.kits} />}
        {vis("how") && <HowItWorks />}
        {vis("reviews") && <Reviews reviews={data.reviews} />}
        {vis("faq") && <Faq faq={data.faq} />}
        {vis("cta") && <CtaBanner />}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
