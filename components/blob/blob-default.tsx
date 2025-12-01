import Image from "next/image";

export default function BlobDefault() {
  return (
    <div className="pointer-events-none">
      <div className="absolute top-0 left-0 w-64 h-64 opacity-100 blur-2xl">
        <Image src="/blob/blob-1.svg" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-10 right-10 w-72 h-72 opacity-100 blur-2xl">
        <Image src="/blob/blob-3.svg" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-1/4 right-10 w-72 h-72 opacity-100 blur-2xl">
        <Image src="/blob/blob-5.svg" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-1/4 left-10 w-72 h-72 opacity-100 blur-2xl">
        <Image src="/blob/blob-4.svg" alt="" fill className="object-contain" />
      </div>
      {/* Top Card */}
      <div className="absolute top-0 w-full left-1/8 h-72 opacity-100 blur-2xl">
        <Image src="/blob/blob-2.svg" alt="" fill className="object-contain" />
      </div>
      {/* Bottom Card */}
      <div className="absolute bottom-30 w-full right-1/8 h-72 opacity-100 blur-2xl">
        <Image src="/blob/blob-6.svg" alt="" fill className="object-contain" />
      </div>
    </div>
  );
}
