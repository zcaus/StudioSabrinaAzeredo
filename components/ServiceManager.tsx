import React, { useState } from 'react';
import { Service } from '../types';
import { dataManager } from '../services/dataManager';

interface ServiceManagerProps {
  services: Service[];
  onUpdate: () => void;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ services, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('60');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    
    try {
      await dataManager.addService({
        name: newName,
        price: parseFloat(newPrice),
        duration_minutes: parseInt(newDuration)
      });
      setNewName('');
      setNewPrice('');
      setIsAdding(false);
      onUpdate();
    } catch (err) {
      alert("Erro ao adicionar serviço");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      await dataManager.deleteService(id);
      onUpdate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Meus Serviços</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#A0814A]/10 text-[#A0814A] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#A0814A]/20"
        >
          {isAdding ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl shadow-sm border border-[#A0814A]/20 animate-slide-down">
          <div className="space-y-3">
             <input 
              className="w-full p-2 border rounded-lg outline-none focus:border-[#A0814A]" 
              placeholder="Nome do Serviço"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <input 
                className="w-1/2 p-2 border rounded-lg outline-none focus:border-[#A0814A]" 
                placeholder="Preço (R$)"
                type="number"
                step="0.01"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                required
              />
              <input 
                className="w-1/2 p-2 border rounded-lg outline-none focus:border-[#A0814A]" 
                placeholder="Minutos"
                type="number"
                value={newDuration}
                onChange={e => setNewDuration(e.target.value)}
              />
            </div>
            <button className="w-full bg-[#A0814A] text-white py-2 rounded-lg font-bold shadow-md">Salvar Serviço</button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {services.map(s => (
          <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 border-[#A0814A]">
            <div>
              <h3 className="font-bold text-gray-800">{s.name}</h3>
              <p className="text-xs text-gray-500">{s.duration_minutes} min</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#A0814A] text-lg">R$ {s.price.toFixed(2)}</span>
              <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceManager;