import Image from "next/image";

/** A real image gallery — the uploaded source had this accidentally duplicated as a copy of RelatedProducts. */
export default function ProductGallery({ gallery, name }: { gallery: string[]; name: string }) {
  if (!gallery.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {gallery.map((src, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-[#F1F1F1] aspect-square relative">
          <Image src={src} alt={`${name} detail ${i + 1}`} fill className="object-cover" />
        </div>
      ))}
    </div>
  );
}
