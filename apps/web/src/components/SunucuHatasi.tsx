export function SunucuHatasi({ mesaj }: { mesaj: string }) {
  return (
    <div role="alert" className="rounded-md border border-cizgi bg-white/60 p-6">
      <p className="font-bold">Kitaplar yüklenemedi.</p>
      <p className="text-murekkep-soluk">{mesaj}</p>
    </div>
  );
}
