import Image from 'next/image';
import { Ruler, Shirt, Users } from 'lucide-react';
import { getHomeContent } from '@/lib/home-content';

export const metadata = {
  title: 'Guía de tallas | Calle Ocho Store',
  description: 'Consulta la guía de tallas para dama, caballero, niña y niño en Calle Ocho Store.',
};

type SizeRow = [string, string, string, string];

const sizeTables: { title: string; icon: typeof Ruler; rows: SizeRow[] }[] = [
  {
    title: 'Damas',
    icon: Shirt,
    rows: [
      ['22', '5', '-', '22'],
      ['22.5', '5.5', '35', '22.5'],
      ['23', '6', '36', '23'],
      ['23.5', '6.5', '36/37', '23.5'],
      ['24', '7', '37', '24'],
      ['24.5', '7.5', '38', '24.5'],
      ['25', '8', '38.5', '25'],
      ['25.5', '8.5', '39', '25.5'],
      ['26', '9', '39.5', '26'],
      ['26.5', '9.5', '40.5', '26.5'],
      ['27', '10', '41', '27'],
    ],
  },
  {
    title: 'Caballero',
    icon: Users,
    rows: [
      ['25', '7', '40', '25'],
      ['25.5', '7.5', '40.5', '25.5'],
      ['26', '8', '41', '26'],
      ['26.5', '8.5', '41.5', '26.5'],
      ['27', '9', '42', '27'],
      ['27.5', '9.5', '42.5', '27.5'],
      ['28', '10', '43', '28'],
      ['28.5', '10.5', '44', '28.5'],
      ['29', '11', '44.5', '29'],
      ['29.5', '11.5', '45', '29.5'],
      ['30', '12', '46', '30'],
      ['31', '13', '46.5', '31'],
    ],
  },
  {
    title: 'Niña',
    icon: Ruler,
    rows: [
      ['14.5', '8.5', '26', '14.5'],
      ['15', '9', '26.5', '15'],
      ['15.5', '9.5', '27', '15.5'],
      ['16', '10', '27.5', '16'],
      ['16.5', '10.5', '28', '16.5'],
      ['17', '11', '28.5', '17'],
      ['17.5', '11.5', '29', '17.5'],
      ['18', '12', '29.5', '18'],
      ['18.5', '12.5', '30', '18.5'],
      ['19', '13', '30.5', '19'],
      ['19.5', '13.5', '31', '19.5'],
      ['20', '1', '31.5', '20'],
      ['20.5', '1.5', '32', '20.5'],
      ['21', '2', '32.5', '21'],
      ['21.5', '2.5', '33', '21.5'],
      ['22', '3', '33.5', '22'],
    ],
  },
  {
    title: 'Niño',
    icon: Ruler,
    rows: [
      ['16.5', '11.5', '29', '16.5'],
      ['17', '12', '29.7', '17'],
      ['17.5', '12.5', '30.5', '17.5'],
      ['18', '13', '31', '18'],
      ['18.5', '13.5', '31.5', '18.5'],
      ['19', '1', '33', '19'],
      ['19.5', '1.5', '33.5', '19.5'],
      ['20', '2', '34', '20'],
      ['20.5', '2.5', '34.7', '20.5'],
      ['21', '3', '35', '21'],
      ['21.5', '3.5', '35.5', '21.5'],
      ['22', '4', '36', '22'],
      ['22.5', '4.5', '37', '22.5'],
      ['23', '5', '37.5', '23'],
    ],
  },
];

export default async function GuiaDeTallasPage() {
  const homeContent = await getHomeContent();

  return (
    <main className="bg-white">
      <section className="relative min-h-[340px] overflow-hidden">
        <Image
          src={homeContent.footerPages.guiaTallas.image}
          alt={homeContent.footerPages.guiaTallas.alt}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="container relative z-10 mx-auto flex min-h-[340px] items-center px-4 text-white">
          <div className="max-w-3xl">
            <Ruler className="mb-4 h-9 w-9" />
            <h1 className="text-4xl font-bold sm:text-5xl">Guía de tallas</h1>
            <p className="mt-4 text-lg leading-relaxed text-white/90">
              Consulta aquí nuestra guía de tallas antes de comprar. Si estás entre dos tallas, escríbenos y te ayudamos a elegir.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2">
          {sizeTables.map((table) => (
            <article key={table.title} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 bg-brand-black px-5 py-4 text-white">
                <table.icon className="h-5 w-5" />
                <h2 className="text-2xl font-bold">{table.title}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-base">
                  <thead className="bg-blue-50 text-brand-black">
                    <tr>
                      <th className="px-5 py-3 font-bold">México</th>
                      <th className="px-5 py-3 font-bold">USA</th>
                      <th className="px-5 py-3 font-bold">Europa</th>
                      <th className="px-5 py-3 font-bold">CMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={`${table.title}-${row.join('-')}`} className="border-t border-gray-100 odd:bg-white even:bg-gray-50">
                        {row.map((cell, index) => (
                          <td key={`${cell}-${index}`} className="px-5 py-3 font-medium text-gray-800">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
