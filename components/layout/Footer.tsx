import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Info Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-700 rounded flex items-center justify-center">
                <span className="text-lg">🦐</span>
              </div>
              <h3 className="font-bold text-lg">Guategambas</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Los mejores productos de calidad para tu cocina. Frescos, deliciosos y siempre disponibles.
            </p>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="tel:+502123456789" className="hover:text-primary transition-colors">
                  📞 +502 1234-5678
                </a>
              </li>
              <li>
                <a href="mailto:info@guategambas.com" className="hover:text-primary transition-colors">
                  ✉️ info@guategambas.com
                </a>
              </li>
              <li className="text-gray-500">📍 Guatemala, GT</li>
            </ul>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Enlaces</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/products" className="hover:text-primary transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Términos
                </Link>
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
            <a href="#" className="hover:text-primary transition-colors">
              Facebook
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Instagram
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
