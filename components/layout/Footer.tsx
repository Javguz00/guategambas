import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Info Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/photos/cliente/logo.jpg"
                alt="Logo Guategambas"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover border border-white/30"
              />
              <h3 className="font-bold text-lg">Guategambas</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Tienda especializada en gambas ornamentales (Neocaridinas y Caridinas) e insumos para gambarios.
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a
                  href="https://wa.me/50243132549"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  📱 WhatsApp: +502 4313-2549
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/guategambas"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  📷 Instagram: @guategambas
                </a>
              </li>
            </ul>
          </div>

          {/* Redes */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Redes</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a
                  href="https://www.instagram.com/guategambas"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/50243132549"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-700 mb-4" />

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-400">
          <p>
            &copy; {currentYear} Guategambas. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a
              href="https://www.instagram.com/guategambas"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://wa.me/50243132549"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
