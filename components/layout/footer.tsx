import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Mail } from 'lucide-react';
import { getHomeContent } from '@/lib/home-content';
import type { HomeContent } from '@/lib/home-content-defaults';
import { cn } from '@/lib/utils';
import { NewsletterForm } from './newsletter-form';

interface FooterLinkGroupProps {
  title: string;
  children: ReactNode;
  centered: boolean;
  mutedColor: string;
}

function safeHexColor(value: string | undefined, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value! : fallback;
}

function FooterLinkGroup({
  title,
  children,
  centered,
  mutedColor,
}: FooterLinkGroupProps) {
  if (!title.trim()) return null;

  return (
    <div className={centered ? 'text-center' : undefined}>
      <h4 className="mb-3 text-xs font-bold uppercase sm:mb-4 sm:text-sm">{title}</h4>
      <ul
        className="space-y-2 text-xs sm:space-y-3 sm:text-sm"
        style={{ color: mutedColor }}
      >
        {children}
      </ul>
    </div>
  );
}

export async function Footer() {
  const facebookUrl =
    process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() ||
    'https://www.facebook.com/profile.php?id=100086381557070';
  const instagramUrl =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ||
    'https://www.instagram.com/calleochogt/?hl=es-la';
  const { footer } = await getHomeContent();
  const settings = footer as HomeContent['footer'];

  const backgroundColor = safeHexColor(settings.backgroundColor, '#1a1a1a');
  const textColor = safeHexColor(settings.textColor, '#ffffff');
  const accentColor = safeHexColor(settings.accentColor, '#2563eb');
  const mutedColor = `${textColor}B3`;
  const borderColor = `${textColor}26`;
  const isCentered = settings.layout === 'centered';
  const isMinimal = settings.layout === 'minimal';
  const showNavigation = settings.showNavigation && !isMinimal;
  const showNewsletter = settings.showNewsletter && !isMinimal;
  const showMainArea = showNavigation || showNewsletter;
  const copyrightText = settings.copyrightText.replaceAll(
    '{year}',
    String(new Date().getFullYear())
  );
  const developerUrl = /^https:\/\//i.test(settings.developerUrl)
    ? settings.developerUrl
    : '';
  const footerStyle = {
    backgroundColor,
    color: textColor,
    '--footer-accent': accentColor,
  } as CSSProperties;

  return (
    <footer
      className={cn('mt-12 sm:mt-16 md:mt-20', isMinimal && 'mt-8 sm:mt-10')}
      style={footerStyle}
    >
      {showMainArea && (
        <div className="container mx-auto px-4 py-8 sm:py-10 md:py-14">
          <div
            className={cn(
              'grid gap-7 sm:gap-8 md:gap-12',
              showNavigation && showNewsletter
                ? 'grid-cols-2 md:grid-cols-4'
                : showNavigation
                  ? 'grid-cols-2 md:grid-cols-3'
                  : 'grid-cols-1',
              isCentered && 'mx-auto max-w-5xl items-start'
            )}
          >
            {showNavigation && (
              <>
                <FooterLinkGroup
                  title={settings.shopTitle}
                  centered={isCentered}
                  mutedColor={mutedColor}
                >
                  <li><Link href="/hombre" className="transition-opacity hover:opacity-70">Hombre</Link></li>
                  <li><Link href="/mujer" className="transition-opacity hover:opacity-70">Mujer</Link></li>
                  <li><Link href="/ninos" className="transition-opacity hover:opacity-70">Niños</Link></li>
                  <li><Link href="/marcas" className="transition-opacity hover:opacity-70">Marcas</Link></li>
                  <li><Link href="/ofertas" className="transition-opacity hover:opacity-70">Ofertas</Link></li>
                </FooterLinkGroup>

                <FooterLinkGroup
                  title={settings.helpTitle}
                  centered={isCentered}
                  mutedColor={mutedColor}
                >
                  <li><Link href="/seguimiento" className="transition-opacity hover:opacity-70">Estado del pedido</Link></li>
                  <li><Link href="/envios" className="transition-opacity hover:opacity-70">Envío y entrega</Link></li>
                  <li><Link href="/guia-de-tallas" className="transition-opacity hover:opacity-70">Guía de tallas</Link></li>
                  <li><Link href="/devoluciones" className="transition-opacity hover:opacity-70">Devoluciones</Link></li>
                  <li><Link href="/contacto" className="transition-opacity hover:opacity-70">Contáctanos</Link></li>
                </FooterLinkGroup>

                <FooterLinkGroup
                  title={settings.aboutTitle}
                  centered={isCentered}
                  mutedColor={mutedColor}
                >
                  <li><Link href="/nosotros" className="transition-opacity hover:opacity-70">Nuestra historia</Link></li>
                  <li><Link href="/terminos" className="transition-opacity hover:opacity-70">Términos de uso</Link></li>
                  <li><Link href="/privacidad" className="transition-opacity hover:opacity-70">Política de privacidad</Link></li>
                </FooterLinkGroup>
              </>
            )}

            {showNewsletter && (
              <div
                className={cn(
                  showNavigation && 'col-span-2 md:col-span-1',
                  isCentered && 'mx-auto w-full max-w-sm text-center'
                )}
              >
                {settings.newsletterTitle.trim() && (
                  <h4 className="mb-3 text-xs font-bold uppercase sm:mb-4 sm:text-sm">
                    {settings.newsletterTitle}
                  </h4>
                )}
                {settings.newsletterText.trim() && (
                  <p className="mb-3 text-xs sm:mb-4 sm:text-sm" style={{ color: mutedColor }}>
                    {settings.newsletterText}
                  </p>
                )}
                <NewsletterForm />
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${borderColor}` }}>
        <div className={cn('container mx-auto px-4', isMinimal ? 'py-5' : 'py-4 sm:py-6')}>
          <div
            className={cn(
              'flex items-center gap-4',
              isCentered
                ? 'flex-col text-center'
                : 'flex-col justify-between md:flex-row',
              isMinimal && 'md:flex-row'
            )}
          >
            {settings.showSocialLinks && (
              <div className="flex items-center gap-5 sm:gap-6">
                {facebookUrl && (
                  <Link
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="transition-opacity hover:opacity-70"
                    style={{ color: accentColor }}
                  >
                    <Facebook className="h-5 w-5" />
                  </Link>
                )}
                {instagramUrl && (
                  <Link
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="transition-opacity hover:opacity-70"
                    style={{ color: accentColor }}
                  >
                    <Instagram className="h-5 w-5" />
                  </Link>
                )}
                {settings.email.trim() && (
                  <Link
                    href={`mailto:${settings.email.trim()}`}
                    aria-label="Correo electrónico"
                    className="transition-opacity hover:opacity-70"
                    style={{ color: accentColor }}
                  >
                    <Mail className="h-5 w-5" />
                  </Link>
                )}
              </div>
            )}

            <div
              className={cn(
                'text-center text-xs sm:text-sm',
                !isCentered && 'md:text-right',
                isMinimal && 'md:text-left'
              )}
              style={{ color: mutedColor }}
            >
              {copyrightText.trim() && <p>{copyrightText}</p>}
              {settings.commercialText.trim() && (
                <p className="mt-1 text-[10px] sm:text-xs">{settings.commercialText}</p>
              )}
              {settings.developerText.trim() && (
                <p className="mt-1 text-[10px] sm:text-xs">
                  {developerUrl ? (
                    <Link
                      href={developerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-70"
                    >
                      {settings.developerText}
                    </Link>
                  ) : (
                    settings.developerText
                  )}
                </p>
              )}
              {settings.extraText.trim() && (
                <p className="mt-1 text-[10px] sm:text-xs">{settings.extraText}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="h-1" style={{ backgroundColor: accentColor }} />
    </footer>
  );
}
