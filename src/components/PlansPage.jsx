import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function PlansPage() {
  const { signed } = useAuth();
  const currentUser = localStorage.getItem('currentUser');
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = 'http://localhost:3001'; 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlansAndUserPlan = async () => {
      try {
        const plansResponse = await axios.get(`${API_URL}/plans`);
        setPlans(plansResponse.data.plans);

        if (signed && currentUser) {
          const userPlanResponse = await axios.get(`${API_URL}/user_plan/${currentUser}`);
          setCurrentPlan(userPlanResponse.data.plan);
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlansAndUserPlan();
  }, [API_URL, signed, currentUser]);

  const handleSubscribeRedirect = (planId, action) => {
    navigate('/checkout', { state: { planId, action } });
  };

  if (!signed) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Você precisa estar logado para ver os planos.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Carregando planos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-red-500 dark:text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white dark:text-gray-800 mb-8">Planos de Assinatura</h1>
      <div className="flex flex-col md:flex-row justify-center items-center gap-8">
        {plans.map((plan) => {
          let buttonLabel = 'Assinar';
          let disabled = false;
          let action = 'subscribe';

          if (currentPlan) {
            if (plan.id === currentPlan.id) {
              buttonLabel = 'Plano Atual';
              disabled = true;
            } else if (plan.movie_limit > currentPlan.movie_limit) {
              buttonLabel = 'Upgrade';
              action = 'upgrade';
            } else if (plan.movie_limit < currentPlan.movie_limit) {
              buttonLabel = 'Downgrade';
              action = 'downgrade';
            }
          }

          return (
            <div key={plan.id} className="bg-gray-700 dark:bg-gray-300 p-6 rounded-lg shadow-lg w-full max-w-sm">
              <h2 className="text-2xl font-semibold text-white dark:text-gray-800 mb-4">{plan.name}</h2>
              <p className="text-lg text-gray-500 dark:text-gray-600 mb-2">Preço: R$ {plan.price.toFixed(2)} / mês</p>
              <p className="text-lg text-gray-500 dark:text-gray-600 mb-4">Filmes por mês: {plan.movie_limit}</p>
              <button
                onClick={() => handleSubscribeRedirect(plan.id, action)}
                className={`w-full ${
                  disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                } text-white py-2 px-4 rounded`}
                disabled={disabled}
              >
                {disabled ? buttonLabel : buttonLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PlansPage;
