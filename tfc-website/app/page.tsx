import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { VSL } from "@/components/VSL";
import { Services } from "@/components/Services";
import { Portal } from "@/components/Portal";
import { Work } from "@/components/Work";
import { Pricing } from "@/components/Pricing";
import { Process } from "@/components/Process";
import { About } from "@/components/About";
import { Team } from "@/components/Team";
import { Locations } from "@/components/Locations";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <VSL />
      <Services />
      <Portal />
      <Work />
      <Pricing />
      <Process />
      <About />
      <Team />
      <Locations />
      <Contact />
    </>
  );
}
