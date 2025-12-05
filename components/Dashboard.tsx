import React, { useState, useEffect, useCallback } from 'react';
import { Appointment, Service, AppointmentStatus, RevenueStats } from '../types';
import { dataManager } from '../services/dataManager';
import { MONTHS } from '../constants';

interface DashboardProps {
  services: Service[];
}

const Dashboard: React.FC<DashboardProps> = ({ services }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RevenueStats>({ predicted: 0, realized: 0 });
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDepositPaid, setFormDepositPaid] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dataManager.getAppointments(selectedMonth, selectedYear);
      setAppointments(data);
      calculateStats(data);
    } catch (error) {
      console.error("Error fetching appointments", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, services]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const calculateStats = (data: Appointment[]) => {
    let predicted = 0; // A Receber
    let realized = 0;  // Faturamento (Dinheiro em caixa)

    data.forEach(appt => {
      const service = services.find(s => s.id === appt.service_id);
      const price = service ? service.price : 0;
      const deposit = price * 0.30; // 30% do valor

      if (appt.status === AppointmentStatus.COMPLETED) {
        // Se completou, o valor total é faturamento (independente de como foi pago o sinal)
        realized += price;
      } else if (appt.status === AppointmentStatus.PENDING) {
        if (appt.deposit_paid) {
            // Sinal pago conta como faturamento
            realized += deposit;
            // O restante (70%) fica a receber
            predicted += (price - deposit);
        } else {
            // Nada pago, tudo a receber
            predicted += price;
        }
      } else if (appt.status === AppointmentStatus.CANCELLED) {
        // Se cancelou mas o sinal foi pago, consideramos que o sinal ficou para o salão (regra comum)
        if (appt.deposit_paid) {
            realized += deposit;
        }
      }
    });

    setStats({ predicted, realized });
  };

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await dataManager.updateAppointmentStatus(id, newStatus);
      fetchAppointments();
    } catch (e) {
      alert("Erro ao atualizar status");
    }
  };

  // Abre o modal de confirmação
  const handleDeleteRequest = (id: string) => {
    setDeleteConfirmationId(id);
  };

  // Executa a exclusão de fato
  const confirmDelete = async () => {
    if (!deleteConfirmationId) return;
    try {
      await dataManager.deleteAppointment(deleteConfirmationId);
      setDeleteConfirmationId(null);
      fetchAppointments();
    } catch(e) {
      alert("Erro ao excluir agendamento");
    }
  };

  const handleEdit = (appt: Appointment) => {
    setEditingId(appt.id);
    setFormName(appt.client_name);
    setFormPhone(appt.client_phone || '');
    setFormServiceId(appt.service_id);
    setFormNotes(appt.notes || '');
    setFormDepositPaid(!!appt.deposit_paid);
    
    const d = new Date(appt.date);
    setFormDate(d.toISOString().split('T')[0]);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    setFormTime(`${hours}:${minutes}`);
    
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormPhone('');
    setFormServiceId(services[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('09:00');
    setFormNotes('');
    setFormDepositPaid(false); // Padrão não pago
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formServiceId || !formDate || !formTime) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    const dateTime = new Date(`${formDate}T${formTime}:00`).toISOString();

    try {
      if (editingId) {
        await dataManager.updateAppointment(editingId, {
          client_name: formName,
          client_phone: formPhone,
          service_id: formServiceId,
          date: dateTime,
          notes: formNotes,
          deposit_paid: formDepositPaid
        });
      } else {
        await dataManager.addAppointment({
          client_name: formName,
          client_phone: formPhone,
          service_id: formServiceId,
          date: dateTime,
          status: AppointmentStatus.PENDING,
          notes: formNotes,
          deposit_paid: formDepositPaid
        });
      }
      setIsModalOpen(false);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar agendamento");
    }
  };

  // Obter preço do serviço selecionado no formulário para mostrar os 30%
  const selectedServicePrice = services.find(s => s.id === formServiceId)?.price || 0;
  const depositValue = selectedServicePrice * 0.30;

  // Filter Logic
  const filteredAppointments = appointments.filter(appt => 
    appt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (appt.client_phone && appt.client_phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Filters and Stats */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-[#A0814A]/20">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-lg font-bold text-[#A0814A] bg-transparent outline-none cursor-pointer appearance-none"
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <span className="text-[#A0814A] font-bold">/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-lg font-bold text-[#A0814A] bg-transparent outline-none cursor-pointer appearance-none"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#A0814A]/10 p-3 rounded-lg text-center transition-transform hover:scale-[1.02]">
            <p className="text-xs text-[#A0814A]/60 uppercase font-bold tracking-wider">A Receber</p>
            <p className="text-xl font-bold text-[#A0814A]">R$ {stats.predicted.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center transition-transform hover:scale-[1.02]">
            <p className="text-xs text-green-500 uppercase font-bold tracking-wider">Faturamento</p>
            <p className="text-xl font-bold text-green-700">R$ {stats.realized.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Appointment List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 ml-1">Agendamentos</h2>
        </div>

        {/* Search Input */}
        <div className="relative">
            <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-xl focus:border-[#A0814A] outline-none text-sm shadow-sm placeholder-gray-400"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 absolute left-3 top-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
        </div>

        {loading ? (
           <div className="text-center py-10 text-gray-400">Carregando...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
            {searchTerm ? 'Nenhum cliente encontrado.' : 'Nenhum agendamento para este mês.'}
          </div>
        ) : (
          filteredAppointments.map(appt => {
            const service = services.find(s => s.id === appt.service_id);
            const dateObj = new Date(appt.date);
            const isCompleted = appt.status === AppointmentStatus.COMPLETED;
            const isCancelled = appt.status === AppointmentStatus.CANCELLED;
            const servicePrice = service ? service.price : 0;
            const depositAmount = servicePrice * 0.30;

            return (
              <div 
                key={appt.id} 
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                  isCompleted ? 'border-green-400' : isCancelled ? 'border-red-400' : 'border-[#A0814A]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{appt.client_name}</h3>
                    <p className="text-sm text-[#A0814A] font-medium">{service?.name || 'Serviço removido'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-700">
                      {dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <p className="text-xs text-gray-400">
                      {dateObj.toLocaleDateString('pt-BR', {day: '2-digit', month:'2-digit'})}
                    </p>
                  </div>
                </div>

                {appt.client_phone && (
                  <p className="text-xs text-gray-500 mb-2 flex items-center">
                    📱 {appt.client_phone}
                  </p>
                )}

                {/* Badge de Sinal Pago */}
                {!isCompleted && !isCancelled && appt.deposit_paid && (
                   <div className="mb-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      ✅ Sinal Pago (R$ {depositAmount.toFixed(2)})
                   </div>
                )}
                
                {/* Indicador de Restante a Pagar */}
                {!isCompleted && !isCancelled && (
                   <p className="text-xs text-gray-400 mb-2">
                     {appt.deposit_paid 
                        ? `Restam R$ ${(servicePrice - depositAmount).toFixed(2)} para receber`
                        : `Valor total a receber: R$ ${servicePrice.toFixed(2)}`
                     }
                   </p>
                )}

                {/* Notas do Agendamento */}
                {appt.notes && (
                  <div className="bg-gray-50 p-2 rounded-md mb-3 border border-gray-100">
                    <p className="text-xs text-gray-600 italic">
                      <span className="font-semibold not-italic">Obs:</span> {appt.notes}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 overflow-x-auto pb-1">
                   {appt.status === AppointmentStatus.PENDING && (
                     <>
                        <button onClick={() => handleStatusChange(appt.id, AppointmentStatus.COMPLETED)} className="flex-1 bg-green-100 text-green-700 text-xs py-2 px-3 rounded-lg font-semibold hover:bg-green-200 active:scale-95 transition-transform whitespace-nowrap">
                          Concluir
                        </button>
                        <button onClick={() => handleEdit(appt)} className="flex-1 bg-blue-100 text-blue-700 text-xs py-2 px-3 rounded-lg font-semibold hover:bg-blue-200 active:scale-95 transition-transform whitespace-nowrap">
                          Editar
                        </button>
                        <button onClick={() => handleStatusChange(appt.id, AppointmentStatus.CANCELLED)} className="flex-1 bg-red-100 text-red-700 text-xs py-2 px-3 rounded-lg font-semibold hover:bg-red-200 active:scale-95 transition-transform whitespace-nowrap">
                          Cancelar
                        </button>
                     </>
                   )}
                   {appt.status !== AppointmentStatus.PENDING && (
                      <div className="flex gap-2 w-full">
                         <button onClick={() => handleStatusChange(appt.id, AppointmentStatus.PENDING)} className="flex-1 bg-gray-100 text-gray-600 text-xs py-2 px-3 rounded-lg hover:bg-gray-200 active:scale-95 transition-transform whitespace-nowrap font-medium">
                           Reabrir
                         </button>
                         {/* Botão de Lixeira visível apenas quando Cancelado */}
                         {appt.status === AppointmentStatus.CANCELLED && (
                             <button onClick={() => handleDeleteRequest(appt.id)} className="w-14 bg-red-50 text-red-500 text-xs py-2 px-2 rounded-lg hover:bg-red-100 active:scale-95 transition-transform flex items-center justify-center border border-red-200" aria-label="Excluir Permanentemente">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                             </button>
                         )}
                      </div>
                   )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB - Floating Action Button */}
      <button 
        onClick={handleCreate}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#A0814A] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#856a3b] active:scale-95 transition-transform z-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nome da Cliente</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#A0814A] outline-none" 
                  placeholder="Ex: Maria Silva"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Telefone (Opcional)</label>
                <input 
                  type="tel" 
                  value={formPhone} 
                  onChange={e => setFormPhone(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#A0814A] outline-none" 
                  placeholder="Ex: 11999999999"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Serviço</label>
                <select 
                  value={formServiceId} 
                  onChange={e => setFormServiceId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#A0814A] outline-none bg-white"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={formDate} 
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#A0814A] outline-none"
                    required
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Hora</label>
                  <input 
                    type="time" 
                    value={formTime} 
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#A0814A] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Checkbox de Sinal */}
              <div className="bg-[#A0814A]/5 p-3 rounded-lg border border-[#A0814A]/10">
                 <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formDepositPaid}
                          onChange={e => setFormDepositPaid(e.target.checked)}
                          className="w-5 h-5 accent-[#A0814A] rounded focus:ring-[#A0814A]"
                        />
                        <span className="text-sm font-semibold text-gray-700">Sinal (30%) Pago?</span>
                    </label>
                    <span className="text-sm font-bold text-[#A0814A]">
                       R$ {depositValue.toFixed(2)}
                    </span>
                 </div>
                 <p className="text-[10px] text-gray-500 mt-1 pl-7">
                    {formDepositPaid 
                      ? 'Este valor entrará no faturamento imediatamente.' 
                      : 'Marque se a cliente já adiantou o valor.'}
                 </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notas / Observações</label>
                <textarea 
                  value={formNotes} 
                  onChange={e => setFormNotes(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#A0814A] outline-none resize-none h-20" 
                  placeholder="Detalhes adicionais (opcional)..."
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 text-white font-semibold bg-[#A0814A] rounded-lg shadow-md hover:bg-[#856a3b] transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                 <h2 className="text-xl font-bold text-gray-800">Excluir Agendamento?</h2>
                 <p className="text-gray-500 text-sm mt-2">Esta ação removerá permanentemente o agendamento. Não é possível desfazer.</p>
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

export default Dashboard;