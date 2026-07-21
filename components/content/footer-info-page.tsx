import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InfoSection {
  title: string;
  body: string;
}

interface FooterInfoPageProps {
  icon: ReactNode;
  title: string;
  intro: string;
  sections: InfoSection[];
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function FooterInfoPage({
  icon,
  title,
  intro,
  sections,
  primaryAction,
  secondaryAction,
}: FooterInfoPageProps) {
  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <section className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20">
          {icon}
        </div>
        <h1 className="text-3xl font-bold text-brand-black dark:text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">
          {intro}
        </p>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className={cn(
                'rounded-lg border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900',
                sections.length % 2 === 1 && index === sections.length - 1 && 'sm:col-span-2'
              )}
            >
              <h2 className="text-lg font-semibold text-brand-black dark:text-white">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {section.body}
              </p>
            </article>
          ))}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {primaryAction && (
              <Button asChild>
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" asChild>
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
