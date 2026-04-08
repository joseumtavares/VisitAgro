import DashboardShell from '@/components/layout/DashboardShell';
import { Users, TrendingUp, Calendar, MapPin } from 'lucide-react';

// Dados mockados para demonstração (serão substituídos por dados reais da API)
const stats = [
  { name: 'Total de Clientes', value: '248', change: '+12%', icon: Users, color: 'text-blue-400' },
  { name: 'Visitas este Mês', value: '87', change: '+23%', icon: Calendar, color: 'text-green-400' },
  { name: 'Pedidos Abertos', value: '34', change: '-5%', icon: TrendingUp, color: 'text-yellow-400' },
  { name: 'Clientes no Mapa', value: '198', change: '+8%', icon: MapPin, color: 'text-purple-400' },
];

const recentAppointments = [
  { id: 1, client: 'Fazenda Santa Rita', date: '2024-01-15 14:00', status: 'scheduled', type: 'visita' },
  { id: 2, client: 'Agropecuária São José', date: '2024-01-15 16:30', status: 'confirmed', type: 'reuniao' },
  { id: 3, client: 'Produtora Verde Campo', date: '2024-01-16 09:00', status: 'scheduled', type: 'visita' },
  { id: 4, client: 'Cooperativo Agro', date: '2024-01-16 11:00', status: 'in_progress', type: 'visita' },
];

const statusColors: Record<string, string> = {
  scheduled: 'badge-info',
  confirmed: 'badge-success',
  in_progress: 'badge-warning',
  completed: 'badge-gray',
  cancelled: 'badge-danger',
};

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-dark-400">Visão geral do seu negócio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="card card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-400 mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className={`text-sm mt-2 ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change} vs mês anterior
                    </p>
                  </div>
                  <div className={`p-4 rounded-full bg-dark-700 ${stat.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Appointments */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Próximos Agendamentos</h2>
            <a href="/dashboard/appointments" className="text-sm text-primary hover:underline">
              Ver todos
            </a>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Data/Hora</th>
                  <th>Tipo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="font-medium text-white">{appointment.client}</td>
                    <td>{new Date(appointment.date).toLocaleString('pt-BR')}</td>
                    <td className="capitalize">{appointment.type}</td>
                    <td>
                      <span className={`badge ${statusColors[appointment.status]}`}>
                        {appointment.status === 'scheduled' && 'Agendado'}
                        {appointment.status === 'confirmed' && 'Confirmado'}
                        {appointment.status === 'in_progress' && 'Em Andamento'}
                        {appointment.status === 'completed' && 'Concluído'}
                        {appointment.status === 'cancelled' && 'Cancelado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/dashboard/clients/new" className="card card-hover cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Novo Cliente</h3>
              <p className="text-sm text-dark-400">Cadastre um novo cliente no sistema</p>
            </div>
          </a>

          <a href="/dashboard/appointments/new" className="card card-hover cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Novo Agendamento</h3>
              <p className="text-sm text-dark-400">Agende uma visita ou reunião</p>
            </div>
          </a>

          <a href="/dashboard/orders/new" className="card card-hover cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Novo Pedido</h3>
              <p className="text-sm text-dark-400">Registre um novo pedido de venda</p>
            </div>
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}
