import React from 'react';
import { getSupabase } from '../services/supabaseClient';

const Settings: React.FC = () => {
  const isConnected = !!getSupabase();

  return (
    <div className="space-y-6">
       <h2 className="text-xl font-bold text-gray-800">Configurações</h2>
       
       <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
         <h3 className="font-semibold text-gray-700 border-b pb-2">Status da Conexão</h3>
         
         <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <p className="text-sm font-medium text-gray-600">
              {isConnected ? 'Conectado ao Supabase' : 'Modo Demo (Local)'}
            </p>
         </div>

         <p className="text-xs text-gray-400 mt-2">
           {isConnected 
             ? 'Seus dados estão sendo sincronizados na nuvem.' 
             : 'Configure as chaves no arquivo services/supabaseClient.ts para ativar a sincronização.'}
         </p>
       </div>

       <div className="bg-white p-5 rounded-xl shadow-sm">
         <h3 className="font-semibold text-gray-700 border-b pb-2 mb-3">Sobre</h3>
         <p className="text-sm text-gray-500">
           Versão 1.1.0<br/>
           Desenvolvido para Studio Sabrina Azeredo.
         </p>
       </div>
    </div>
  );
};

export default Settings;