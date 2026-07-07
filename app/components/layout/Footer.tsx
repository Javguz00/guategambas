'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold mb-4">Guategambas</h3>
            <p className="text-gray-400">
              Gambas ornamentales neocaridinas y caridinas, mas insumos para gambarios y acuarios.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Redes</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="https://www.instagram.com/guategambas"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/50243132549"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Contacto</h4>
            <p className="text-gray-400">WhatsApp: +502 4313-2549</p>
            <p className="text-gray-400">Instagram: @guategambas</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 Guategambas. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
