/**
 * Pocetna je u SVOM native Stack-u samo zbog zaglavlja: na iOS-u native traka
 * daje pravi UIMenu sa zamucenjem na dodir i Liquid Glass dugmad
 * (`unstable_headerRightItems` u index.tsx). Isti Stack imaju svi tabovi —
 * vidi `components/tab-stack.tsx`.
 */
export { TabStack as default } from '@/components/tab-stack';
