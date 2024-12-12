import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:3001';

function CheckoutPage() {
  const { signed } = useAuth();
  const currentUser = localStorage.getItem('currentUser');
  const location = useLocation();
  const navigate = useNavigate();

  const { planId, action } = location.state || {};

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!signed || !currentUser) {
      navigate('/login');
      return;
    }

    if (!planId || !action) {
      setError('Plano ou ação inválida.');
      setLoading(false);
      return;
    }

    const fetchPlanDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/plans`);
        const selectedPlan = response.data.plans.find((p) => p.id === planId);
        if (!selectedPlan) {
          setError('Plano não encontrado.');
        } else {
          setPlan(selectedPlan);
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes do plano:', err);
        setError('Não foi possível carregar os detalhes do plano.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [planId, action, signed, currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !paymentInfo.cardNumber ||
      !paymentInfo.expiryDate ||
      !paymentInfo.cvv ||
      !paymentInfo.cardHolder
    ) {
      alert('Por favor, preencha todas as informações de pagamento.');
      return;
    }

    setProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); 

      const response = await axios.post(`${API_URL}/subscribe`, {
        username: currentUser,
        plan_id: planId,
        action,
      });

      setSuccessMessage(response.data.message || 'Assinatura realizada com sucesso!');
      
      setTimeout(() => {
        navigate('/plans', { replace: true, state: { success: 'Assinatura realizada com sucesso!' } });
      }, 3000);
    } catch (err) {
      console.error('Erro ao processar assinatura:', err.response?.data?.error || err.message);
      alert(err.response?.data?.error || 'Erro ao processar assinatura.');
    } finally {
      setProcessing(false);
    }
  };

  if (!signed) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Você precisa estar logado para realizar o checkout.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Carregando detalhes do plano...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <span className="text-red-500 dark:text-red-400 mb-4">{error}</span>
        <Link to="/plans" className="text-blue-500 hover:underline">
          Voltar para os Planos
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Link to="/plans" className="text-indigo-600 dark:text-indigo-400 hover:underline">
        &larr; Voltar para os Planos
      </Link>
      <h1 className="text-3xl font-bold text-white dark:text-gray-800 mb-8 mt-4">Checkout</h1>

      {successMessage ? (
        <div className="p-4 bg-green-500 text-white rounded">
          {successMessage}
        </div>
      ) : (
        <div className="bg-gray-700 dark:bg-gray-300 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-white dark:text-gray-800 mb-4">{plan.name}</h2>
          <p className="text-lg text-gray-500 dark:text-gray-600 mb-2">Preço: R$ {plan.price.toFixed(2)} / mês</p>
          <p className="text-lg text-gray-500 dark:text-gray-600 mb-4">Filmes por mês: {plan.movie_limit}</p>

          <form onSubmit={handleSubmit} className="mt-6">
            <h3 className="text-xl font-semibold text-white dark:text-gray-800 mb-4">Informações de Pagamento</h3>
            <div className="mb-4">
              <label htmlFor="cardNumber" className="block text-gray-200 dark:text-gray-800 mb-2">Número do Cartão</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={paymentInfo.cardNumber}
                onChange={handleChange}
                className="w-full p-2 rounded border text-gray-600 border-gray-400 dark:border-gray-600"
                placeholder="1234 5678 9012 3456"
                required
              />
            </div>
            <div className="mb-4 flex space-x-4">
              <div className="flex-1">
                <label htmlFor="expiryDate" className="block text-gray-200 dark:text-gray-800 mb-2">Data de Validade</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  value={paymentInfo.expiryDate}
                  onChange={handleChange}
                  className="w-full p-2 text-gray-600 rounded border border-gray-400 dark:border-gray-600"
                  placeholder="MM/AA"
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="cvv" className="block text-gray-200 dark:text-gray-800 mb-2">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={paymentInfo.cvv}
                  onChange={handleChange}
                  className="w-full p-2 rounded border text-gray-600 border-gray-400 dark:border-gray-600"
                  placeholder="123"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="cardHolder" className="block text-gray-200 dark:text-gray-800 mb-2">Nome do Titular</label>
              <input
                type="text"
                id="cardHolder"
                name="cardHolder"
                value={paymentInfo.cardHolder}
                onChange={handleChange}
                className="w-full p-2 rounded border text-gray-600 border-gray-400 dark:border-gray-600"
                placeholder="João da Silva"
                required
              />
            </div>
            <button
              type="submit"
              className={`w-full ${
                processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
              } text-white py-2 px-4 rounded`}
              disabled={processing}
            >
              {processing ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
