import React, { useState } from 'react';
import { Service } from '../types';
import { dataManager } from '../services/dataManager';

interface ServiceManagerProps {
  services: Service[];
  onUpdate: () => void;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ services, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setFormName(service.name);
    setFormPrice(service.price.toString());
    setIsAdding(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setFormName('');
    setFormPrice('');
    setIsAdding(!isAdding);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) return;
    
    try {
      if (editingId) {
        await dataManager.updateService(editingId, {
            name: formName,
            price: parseFloat(formPrice)
        });
      } else {
        await dataManager.addService({
            name: formName,
            price: parseFloat(formPrice)
        });
      }
      
      setFormName('');
      setFormPrice('');
      setEditingId(null);
      setIsAdding(false);
      onUpdate();
    } catch (err) {
      alert("Erro ao salvar serviço");
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmationId) return;
    try {
      await dataManager.deleteService(deleteConfirmationId);
      onUpdate();
      setDeleteConfirmationId(null);
    } catch (e) {
      alert("Erro ao excluir serviço");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Meus Serviços</h2>
        <button 
          onClick={handleNew}
          className="bg-[#A0814A]/10 text-[#A0814A] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#A0814A]/20"
        >
          {isAdding && !editingId ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm border border-[#A0814A]/20 animate-slide-down">
          <div className="space-y-3">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-500">{editingId ? 'Editar Serviço' : 'Adicionar Serviço'}</h3>
                {editingId && <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-xs text-gray-400">Cancelar</button>}
             </div>
             <input 
              className="w-full p-2 border rounded-lg outline-none focus:border-[#A0814A]" 
              placeholder="Nome do Serviço"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <input 
                className="w-full p-2 border rounded-lg outline-none focus:border-[#A0814A]" 
                placeholder="Preço (R$)"
                type="number"
                step="0.01"
                value={formPrice}
                onChange={e => setFormPrice(e.target.value)}
                required
              />
            </div>
            <button className="w-full bg-[#A0814A] text-white py-2 rounded-lg font-bold shadow-md">
                {editingId ? 'Atualizar' : 'Salvar Serviço'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {services.map(s => (
          <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 border-[#A0814A]">
            <div>
              <h3 className="font-bold text-gray-800">{s.name}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#A0814A] text-lg">R$ {s.price.toFixed(2)}</span>
              
              <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-600 p-2 bg-blue-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>

              <button onClick={() => handleDeleteRequest(s.id)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in">
              <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                 </div>
                 <h2 className="text-xl font-bold text-gray-800">Excluir Serviço?</h2>
                 <p className="text-gray-500 text-sm mt-2">Esta ação removerá o serviço. Histórico de agendamentos passados pode perder o nome do serviço.</p>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setDeleteConfirmationId(null)} className="flex-1 py-3 text-gray-700 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                    Cancelar
                 </button>
                 <button onClick={confirmDelete} className="flex-1 py-3 text-white font-semibold bg-red-500 rounded-xl hover:bg-red-600 shadow-md transition-colors">
                    Excluir
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManager;