const API_BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '') + '/api'
  : 'http://localhost:5002/api';

// Função genérica para fazer requisições GET
async function fetchData(endpoint ) {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error; // Re-throw para que o componente que chamou possa lidar com o erro
  }
}

// Função específica para buscar jogos com paginação e filtros
export const fetchGames = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Parâmetros padrão
  const defaultParams = {
    page: 1,
    page_size: 20,
    ordering: '-added'
  };
  
  // Combinar parâmetros padrão com os fornecidos
  const finalParams = { ...defaultParams, ...params };
  
  // Adicionar parâmetros à query string
  Object.entries(finalParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  const endpoint = `games?${queryParams.toString()}`;
  return fetchData(endpoint);
};

// Função para buscar jogos com scroll infinito
export const fetchGamesInfinite = async (page = 1, filters = {}) => {
  const params = {
    page,
    page_size: 20,
    ...filters
  };
  
  return fetchGames(params);
};

// Funções específicas para buscar dados (mantidas para compatibilidade)
export const fetchPopularGames = (page = 1, pageSize = 12) => {
  return fetchGames({
    ordering: '-added',
    page,
    page_size: pageSize
  });
};

export const fetchRecentGames = (page = 1, pageSize = 12) => {
  return fetchGames({
    ordering: '-released',
    page,
    page_size: pageSize
  });
};

// Função para buscar um jogo específico
export const fetchGameDetails = (gameId) => fetchData(`games/${gameId}`);

// Função para buscar gêneros
export const fetchGenres = () => fetchData('games/genres');

// Função para buscar plataformas
export const fetchPlatforms = () => fetchData('games/platforms');

// Função para buscar notícias
export const fetchNews = () => fetchData('news');
export const fetchConsoleNews = () => fetchData('news/consoles');

// Função para buscar reviews de críticos
export const fetchCriticReviews = () => fetchData('games/critic-reviews');

// Função para buscar reviews detalhadas de um jogo específico
export const fetchGameReviews = (gameId) => fetchData(`games/${gameId}/reviews`);

// Função para adicionar review de usuário
export const addUserReview = async (gameId, reviewData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error adding review for game ${gameId}:`, error);
    throw error;
  }
};

// Função para buscar jogos com debounce (útil para search)
export const fetchGamesWithDebounce = (() => {
  let timeoutId;
  
  return (params, delay = 500) => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await fetchGames(params);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
})();
