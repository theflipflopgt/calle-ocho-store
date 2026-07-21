'use client';

import { Truck, Shield, RotateCcw } from 'lucide-react';

/**
 * Ticker promocional con scroll infinito
 * Inspirado en Kicks.com.gt pero con estilo Calle Ocho Store
 */
export function PromoTicker() {
  const messages = [
    { icon: Truck, text: 'Envío GRATIS en compras mayores a $1,500' },
    { icon: Shield, text: '100% Productos Originales' },
    { icon: RotateCcw, text: 'Devoluciones GRATIS en 30 días' },
  ];

  return (
    <div className="bg-brand-black text-white overflow-hidden relative">
      <div className="animate-scroll flex whitespace-nowrap py-3">
        {/* Repetir mensajes 3 veces para scroll infinito */}
        {[...Array(3)].map((_, groupIndex) => (
          <div key={groupIndex} className="flex items-center">
            {messages.map((message, index) => (
              <div
                key={`${groupIndex}-${index}`}
                className="flex items-center gap-2 mx-8"
              >
                <message.icon className="w-4 h-4 text-brand-blue" />
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
