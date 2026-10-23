import { InputHTMLAttributes } from 'react';

export function FormAlani({
  etiket,
  hata,
  ...input
}: { etiket: string; hata?: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = input.id ?? input.name;
  const hataId = `${id}-hata`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {etiket}
      </label>
      <input
        aria-invalid={hata ? true : undefined}
        aria-describedby={hata ? hataId : undefined}
        {...input}
        id={id}
        className="rounded-md border border-cizgi bg-white px-3 py-2 aria-[invalid]:border-hata"
      />
      {hata && (
        <p id={hataId} className="text-sm text-hata">
          {hata}
        </p>
      )}
    </div>
  );
}

export function FormMesaji({ hata, mesaj }: { hata?: string; mesaj?: string }) {
  if (hata) {
    return (
      <p role="alert" className="rounded-md border-l-4 border-hata bg-hata/5 px-4 py-3 text-hata">
        {hata}
      </p>
    );
  }
  if (mesaj) {
    return (
      <p role="status" className="rounded-md border-l-4 border-basari bg-basari/5 px-4 py-3 text-basari">
        {mesaj}
      </p>
    );
  }
  return null;
}
