import { redirect } from 'next/navigation';

export default function HeroCarouselRedirectPage() {
  redirect('/admin/inicio#hero');
}
