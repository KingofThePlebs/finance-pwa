# Finance — PWA

Osobní přehled výdajů a příjmů (a investic). React + Vite + PWA, data v localStorage.

## Lokálně

```bash
npm install
npm run dev      # vývoj
npm run build    # produkční build → dist/
npm run preview  # otestovat build lokálně
```

## Nasazení na Vercel

1. Nahraj tento repozitář na GitHub.
2. Importuj repo ve Vercelu.
3. Prezet: **Vite** (Vercel to pozná sám).
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy. Otevři na iPhonu → "Přidat na plochu" (Add to Home Screen).

Pozn.: Ceny akcií se stahují z Yahoo Finance přímým fetch z prohlížeče. Velmi staré/obskurní tickery nemusí projít CORS — aktuální cenu lze zadat ručně ve formuláři.
