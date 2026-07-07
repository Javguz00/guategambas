import { Badge } from '@/components/ui';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
}

interface OrderTableProps {
  orders: Order[];
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

const statusConfig = {
  pending: { label: 'Pendiente', variant: 'warning' as const },
  processing: { label: 'Procesando', variant: 'info' as const },
  shipped: { label: 'Enviado', variant: 'info' as const },
  delivered: { label: 'Entregado', variant: 'success' as const },
  cancelled: { label: 'Cancelado', variant: 'danger' as const },
};

export default function OrderTable({ orders, onEdit, onView }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg">No hay órdenes</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead className="border-b-2 border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Orden</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Cliente</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Fecha</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-dark">Artículos</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-dark">Total</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Estado</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-dark">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order, idx) => (
            <tr key={order.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 text-sm font-semibold text-primary">
                #{order.orderNumber}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{order.customer}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {new Date(order.date).toLocaleDateString('es-GT')}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {order.items}
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-dark">
                Q{order.total.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm">
                <Badge variant={statusConfig[order.status].variant}>
                  {statusConfig[order.status].label}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-center">
                <div className="flex gap-2 justify-center">
                  {onView && (
                    <button
                      onClick={() => onView(order.id)}
                      className="px-2 py-1 text-primary hover:bg-primary hover:text-white rounded transition-colors text-xs font-semibold"
                    >
                      Ver
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(order.id)}
                      className="px-2 py-1 text-secondary hover:bg-secondary hover:text-white rounded transition-colors text-xs font-semibold"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
