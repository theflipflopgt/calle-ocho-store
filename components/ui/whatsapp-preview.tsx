'use client';

import { useState } from 'react';
import { X, Send, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" className={className}>
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
  );
}

interface WhatsappPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  defaultMessage?: string;
}

export function WhatsappPreview({
  isOpen,
  onClose,
  phoneNumber,
  defaultMessage = '¡Hola! Me interesa obtener más información sobre sus productos.',
}: WhatsappPreviewProps) {
  const [message, setMessage] = useState(defaultMessage);

  const handleSend = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const quickMessages = [
    '¿Tienen disponible en mi talla?',
    '¿Cuánto tarda el envío?',
    '¿Hacen envíos a todo Guatemala?',
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* WhatsApp Preview Modal */}
      <div className="fixed inset-3 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[380px] sm:h-auto max-h-[calc(100vh-1.5rem)] sm:max-h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header - WhatsApp style */}
        <div className="bg-[#075E54] text-white p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">TF</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Calle Ocho Store</h3>
              <p className="text-[10px] sm:text-xs text-white/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></span>
                En línea
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat area - WhatsApp background style */}
        <div
          className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto"
          style={{
            backgroundColor: '#E5DDD5',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ccc5b9' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        >
          {/* Received message */}
          <div className="flex justify-start">
            <div className="bg-white rounded-lg rounded-tl-none px-3 sm:px-4 py-2 shadow-sm max-w-[90%] sm:max-w-[85%]">
              <p className="text-xs sm:text-sm text-gray-800">
                ¡Hola! 👋 Bienvenido a Calle Ocho Store
              </p>
              <p className="text-xs sm:text-sm text-gray-800 mt-1">
                ¿En qué podemos ayudarte hoy?
              </p>
              <p className="text-[9px] sm:text-[10px] text-gray-500 text-right mt-1">
                Ahora
              </p>
            </div>
          </div>

          {/* Quick response buttons */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-end">
            {quickMessages.map((msg, index) => (
              <button
                key={index}
                onClick={() => setMessage(msg)}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded-full border transition-colors",
                  message === msg
                    ? "bg-[#25D366] text-white border-[#25D366]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#25D366] hover:text-[#25D366]"
                )}
              >
                {msg}
              </button>
            ))}
          </div>

          {/* User's message preview */}
          {message && (
            <div className="flex justify-end">
              <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none px-3 sm:px-4 py-2 shadow-sm max-w-[90%] sm:max-w-[85%]">
                <p className="text-xs sm:text-sm text-gray-800">{message}</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 text-right mt-1">
                  Tu mensaje
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-2.5 sm:p-3 bg-[#F0F0F0] border-t">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#25D366] text-gray-900 text-xs sm:text-sm resize-none"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#20BA5C] transition-colors flex-shrink-0"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          <p className="text-[9px] sm:text-[10px] text-gray-500 text-center mt-1.5 sm:mt-2 flex items-center justify-center gap-1">
            <WhatsAppIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            Se abrirá WhatsApp con tu mensaje
          </p>
        </div>

        {/* Alternative: Call button */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 bg-[#F0F0F0]">
          <a
            href={`tel:+${phoneNumber}`}
            className="flex items-center justify-center gap-2 w-full py-2 sm:py-2.5 text-xs sm:text-sm text-[#075E54] hover:bg-white rounded-lg transition-colors"
          >
            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            O llámanos directamente
          </a>
        </div>
      </div>
    </>
  );
}
