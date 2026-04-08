import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { mockStores } from "@/lib/mock-stores";

export default function CustomerHomePage() {
  return (
    <div className="px-4 pb-8 pt-8 md:mx-auto md:max-w-4xl">
      <header className="mb-8 text-center">
        <p className="font-serif text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 md:text-4xl">
          Maju Bersama 178
        </p>
        <p className="mt-2 font-serif text-lg text-zinc-400 md:text-xl">
          Pilih Toko
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {mockStores.map((store) => (
          <Card
            key={store.id}
            title={store.name}
            imageSrc={store.imageSrc}
            imageAlt={store.imageAlt}
            darkened={store.darkened}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={store.storePath}
                className={`${buttonClass("toko")} flex-1 text-center`}
              >
                Toko
              </Link>
              <a
                className={`${buttonClass("whatsapp")} flex-1 text-center`}
                href={`https://wa.me/${store.whatsappE164}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
