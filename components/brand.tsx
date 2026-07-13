import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      className={`brand${compact ? " brand--footer" : ""}`}
      href="/"
      aria-label="Lightlink 도구 모음"
    >
      <Image
        src="/brand/lightlink-wordmark-blue.png"
        alt="LightLink"
        width={946}
        height={200}
        priority={!compact}
        className="brand-wordmark"
      />
    </Link>
  );
}
