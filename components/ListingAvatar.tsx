import Image from "next/image";

type ListingAvatarProps = {
  name: string;
  logoUrl: string | null;
  className?: string;
};

export default function ListingAvatar({ name, logoUrl, className = "" }: ListingAvatarProps) {
  const tone = (name.codePointAt(0) ?? 0) % 4;

  return (
    <span className={`avatar avatar-tone-${tone} ${className}`} aria-hidden="true">
      {logoUrl ? <Image src={logoUrl} alt="" width={64} height={64} unoptimized /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}