import type { ProductInclude } from "@/lib/types";

export default function ProductFeatures({ features, includes }: { features: string; includes: ProductInclude[] }) {
  return (
    <div className="flex flex-wrap gap-20 py-20">
      <div className="flex-[2_1_400px]">
        <h2 className="text-2xl font-bold uppercase tracking-wide mb-7">Features</h2>
        {features.split("\n\n").map((para, i) => (
          <p key={i} className="text-black/50 leading-[1.875] text-[15px]" style={{ marginBottom: i === 0 ? 20 : 0 }}>{para}</p>
        ))}
      </div>
      <div className="flex-[1_1_200px]">
        <h2 className="text-2xl font-bold uppercase tracking-wide mb-7">In The Box</h2>
        <div className="flex flex-col gap-3">
          {includes.map((item, index) => (
            <div key={index} className="flex items-center gap-6">
              <span className="text-[#D87D4A] font-bold min-w-[28px]">{item.quantity}x</span>
              <span className="text-black/50 text-[15px]">{item.item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
