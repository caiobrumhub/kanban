import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Client } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const initialForm = {
    name: '', document: '', stateRegistration: '', email: '', phone: '',
    zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch {
      setError('Erro ao carregar clientes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      document: client.document || '',
      stateRegistration: client.stateRegistration || '',
      email: client.email || '',
      phone: client.phone || '',
      zipCode: client.zipCode || '',
      street: client.street || '',
      number: client.number || '',
      complement: client.complement || '',
      neighborhood: client.neighborhood || '',
      city: client.city || '',
      state: client.state || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingClient) {
        const { data } = await api.patch(`/clients/${editingClient.id}`, formData);
        setClients(clients.map(c => c.id === data.id ? data : c));
        alert('Cliente atualizado com sucesso!');
      } else {
        const { data } = await api.post('/clients', formData);
        setClients([data, ...clients]);
        alert('Cliente criado com sucesso!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar cliente.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.document && c.document.includes(searchQuery))
  );

  if (isLoading) return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto w-full pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Cadastro de Clientes</h1>
        <p className="text-slate-400">Gerencie a base de clientes (CRM) do sistema</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <i className="fi fi-rr-search"></i>
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-700/50 border border-surface-600 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-primary-500 transition-colors placeholder:text-slate-500"
            />
          </div>
          <Button variant="primary" className="flex items-center gap-2" onClick={handleOpenCreate}>
            <i className="fi fi-rr-plus"></i> Novo Cliente
          </Button>
        </div>

        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-700/50 border-b border-surface-600">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-300">ID</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-300">Nome / Razão Social</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-300">Documento</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-300">Contato</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-surface-600/50 hover:bg-surface-700/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400">#{client.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{client.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Criado por: {client.createdBy?.name || 'Desconhecido'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{client.document || <span className="text-slate-500 italic">Não informado</span>}</div>
                      <div className="text-xs text-slate-400 mt-0.5">IE: {client.stateRegistration || 'ISENTO'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-300 text-sm"><i className="fi fi-rr-envelope text-xs mr-1"></i> {client.email || '-'}</div>
                      <div className="text-slate-300 text-sm"><i className="fi fi-rr-phone-call text-xs mr-1"></i> {client.phone || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" onClick={() => handleOpenEdit(client)} className="!py-2 !px-3 text-xs border border-surface-600 text-slate-300 hover:text-white flex items-center justify-center gap-1.5">
                        <i className="fi fi-rr-edit text-sm"></i> Editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">Nenhum cliente encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? "Editar Cliente" : "Novo Cliente"}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wider mb-2 border-b border-surface-600/50 pb-1">Dados Fiscais</h3>
            <Input label="Nome ou Razão Social" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoFocus />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="CPF ou CNPJ" value={formData.document} onChange={(e) => setFormData({ ...formData, document: e.target.value })} placeholder="Obrigatório de acordo com o sistema" />
              <Input label="Inscrição Estadual" value={formData.stateRegistration} onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })} placeholder="Ex: ISENTO" />
            </div>
            
            <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wider mt-4 mb-2 border-b border-surface-600/50 pb-1">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="E-mail" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <Input label="Telefone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wider mt-4 mb-2 border-b border-surface-600/50 pb-1">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <div className="md:col-span-1">
                 <Input label="CEP" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} />
               </div>
               <div className="md:col-span-2">
                 <Input label="Logradouro" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div className="col-span-1">
                 <Input label="Número" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} />
               </div>
               <div className="col-span-1 md:col-span-3">
                 <Input label="Complemento" value={formData.complement} onChange={(e) => setFormData({ ...formData, complement: e.target.value })} />
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <Input label="Bairro" value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} />
               <Input label="Cidade" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
               <Input label="Estado" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="UF" />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-surface-800 p-2 rounded-lg border-t border-surface-600">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              {actionLoading ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientsPage;
