import { ReactNode } from "react";
import StructureTabs from "./ui/StructureTabs";
import SlidePane from "./ui/SlidePane";

export default function StructureLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <StructureTabs />
      </div>

      <SlidePane>{children}</SlidePane>
    </div>
  );
}