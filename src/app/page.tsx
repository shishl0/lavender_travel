import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Destinations from "@/components/Destinations";
import WhyUs from "@/components/WhyUs";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import SmoothScroll from "@/components/SmoothScroll";

export default function Page() {
  return (
    <>
      <SmoothScroll></SmoothScroll>
      <Header />
      <main>
        <Hero />
        <Destinations />
        <WhyUs />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}