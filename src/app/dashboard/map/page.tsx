import DashboardShell from '@/components/layout/DashboardShell';
import InteractiveMap from '@/components/map/InteractiveMap';
import { Client } from '@/types';

// Dados mockados para demonstração
const mockClients: Client[] = [
  {
    id: '1',
    company_id: '1',
    name: 'Fazenda Santa Rita',
    trade_name: 'Santa Rita Agro',
    document: '12.345.678/0001-90',
    email: 'contato@santarita.com.br',
    phone: '(11) 99999-1111',
    address: 'Rodovia BR-163, Km 250',
    number: 'S/N',
    city: 'Sorriso',
    state: 'MT',
    zip_code: '78890-000',
    latitude: -12.5489,
    longitude: -55.7189,
    status: 'active',
    priority: 'high',
    notes: 'Cliente desde 2020',
    tags: ['grande', 'grãos'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    company_id: '1',
    name: 'Agropecuária São José',
    document: '98.765.432/0001-10',
    email: 'contato@saojose.com.br',
    phone: '(65) 98888-2222',
    address: 'Estrada Rural do Limoeiro',
    number: '1500',
    city: 'Lucas do Rio Verde',
    state: 'MT',
    zip_code: '78455-000',
    latitude: -13.0528,
    longitude: -55.9089,
    status: 'prospect',
    priority: 'normal',
    notes: 'Interesse em fertilizantes',
    tags: ['medio', 'pecuaria'],
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
  },
  {
    id: '3',
    company_id: '1',
    name: 'Produtora Verde Campo',
    document: '11.222.333/0001-44',
    email: 'contato@verdecampo.com.br',
    phone: '(66) 97777-3333',
    address: 'Fazenda Boa Vista',
    number: 'Km 50',
    city: 'Rondonópolis',
    state: 'MT',
    zip_code: '78705-000',
    latitude: -16.4708,
    longitude: -54.6358,
    status: 'active',
    priority: 'urgent',
    notes: 'Necessita visita técnica urgente',
    tags: ['grande', 'hortifruti'],
    created_at: '2023-12-20T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '4',
    company_id: '1',
    name: 'Cooperativo Agro',
    document: '55.666.777/0001-88',
    email: 'contato@coopagro.com.br',
    phone: '(67) 96666-4444',
    address: 'Av. das Cooperativas',
    number: '2000',
    city: 'Dourados',
    state: 'MS',
    zip_code: '79800-000',
    latitude: -22.2211,
    longitude: -54.8056,
    status: 'inactive',
    priority: 'low',
    notes: 'Em reestruturação',
    tags: ['cooperativa'],
    created_at: '2023-11-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '5',
    company_id: '1',
    name: 'Fazenda Esperança',
    document: '33.444.555/0001-22',
    email: 'contato@esperanca.com.br',
    phone: '(64) 95555-5555',
    address: 'Zona Rural',
    number: 'Gleba 5',
    city: 'Rio Verde',
    state: 'GO',
    zip_code: '75901-000',
    latitude: -17.7944,
    longitude: -50.9194,
    status: 'blocked',
    priority: 'normal',
    notes: 'Pagamentos em atraso',
    tags: ['medio', 'grãos'],
    created_at: '2023-10-15T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
  },
];

export default function MapPage() {
  const handleMarkerClick = (client: Client) => {
    console.log('Client clicked:', client);
    // Aqui você pode abrir um modal ou navegar para a página do cliente
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Mapa de Clientes</h1>
            <p className="text-dark-400">Visualize todos os clientes no mapa interativo</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-dark-300">Prospect</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-dark-300">Ativo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-dark-300">Inativo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-dark-300">Bloqueado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card py-4">
            <p className="text-sm text-dark-400">Total</p>
            <p className="text-2xl font-bold text-white">{mockClients.length}</p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-blue-400">Prospects</p>
            <p className="text-2xl font-bold text-white">
              {mockClients.filter(c => c.status === 'prospect').length}
            </p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-green-400">Ativos</p>
            <p className="text-2xl font-bold text-white">
              {mockClients.filter(c => c.status === 'active').length}
            </p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-gray-400">Inativos</p>
            <p className="text-2xl font-bold text-white">
              {mockClients.filter(c => c.status === 'inactive').length}
            </p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-red-400">Bloqueados</p>
            <p className="text-2xl font-bold text-white">
              {mockClients.filter(c => c.status === 'blocked').length}
            </p>
          </div>
        </div>

        {/* Map */}
        <InteractiveMap 
          clients={mockClients}
          height="h-[600px]"
          onMarkerClick={handleMarkerClick}
        />

        {/* Client List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Lista de Clientes</h2>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cidade/UF</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {mockClients.map((client) => (
                  <tr key={client.id}>
                    <td className="font-medium text-white">{client.name}</td>
                    <td>{client.city}/{client.state}</td>
                    <td>
                      <span className={`badge ${
                        client.status === 'active' ? 'badge-success' :
                        client.status === 'prospect' ? 'badge-info' :
                        client.status === 'inactive' ? 'badge-gray' :
                        'badge-danger'
                      }`}>
                        {client.status === 'active' && 'Ativo'}
                        {client.status === 'prospect' && 'Prospect'}
                        {client.status === 'inactive' && 'Inativo'}
                        {client.status === 'blocked' && 'Bloqueado'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        client.priority === 'urgent' ? 'badge-danger' :
                        client.priority === 'high' ? 'badge-warning' :
                        client.priority === 'normal' ? 'badge-info' :
                        'badge-gray'
                      }`}>
                        {client.priority === 'urgent' && 'Urgente'}
                        {client.priority === 'high' && 'Alta'}
                        {client.priority === 'normal' && 'Normal'}
                        {client.priority === 'low' && 'Baixa'}
                      </span>
                    </td>
                    <td>{client.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
