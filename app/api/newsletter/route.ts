import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type NewsletterInsertClient = {
  from: (table: 'newsletter_subscribers') => {
    insert: (values: {
      email: string;
      status: 'active';
      source: string;
      consent_text: string;
    }) => Promise<{
      error: { code?: string } | null;
    }>;
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Ingresa un correo válido.' },
        { status: 400 }
      );
    }

    const supabase = (await createClient()) as unknown as NewsletterInsertClient;
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email,
        status: 'active',
        source: 'footer',
        consent_text: 'Acepta recibir novedades y promociones de Calle Ocho Store.',
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({
          message: 'Este correo ya está suscrito.',
        });
      }

      console.error('Newsletter subscription error:', error);
      return NextResponse.json(
        { error: 'No se pudo guardar el correo. Revisa la configuración de Supabase.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Listo, quedaste suscrito a Calle Ocho Store.',
    });
  } catch (error) {
    console.error('Newsletter route error:', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la suscripción.' },
      { status: 500 }
    );
  }
}
