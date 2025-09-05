import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    resources: {
      en: {
        common: {
          app: {
            name: "Raykiro Games",
            tagline: "Discover and Rate the Best Games"
          },
          navigation: {
            home: "Home",
            games: "Games",
            reviews: "Reviews",
            popular: "Popular",
            login: "Login",
            signup: "Sign Up",
            search: "Search games..."
          },
          homepage: {
            hero: {
              title: "Welcome Gamer!",
              titleHighlight: "",
              subtitle: "Discover new games, read reviews and share your experiences!",
              searchPlaceholder: "Search games, genres, platforms...",
              searchButton: "Search",
              exploreGames: "Explore Games",
              readReviews: "Read Reviews"
            },
            stats: {
              games: "Games Cataloged",
              reviews: "Reviews Published",
              users: "Active Users"
            },
            popularGames: {
              title: "📈 Popular Games",
              viewAll: "View All",
              loading: "Loading popular games..."
            },
            recentReleases: {
              title: "🕒 Recent Releases",
              viewAll: "View All",
              loading: "Loading recent releases..."
            },
            news: {
              title: "Gaming News",
              loading: "Loading news...",
              readMore: "Read More",
              justNow: "now",
              ago: "ago",
              yesterday: "yesterday"
            },
            sections: {
              popular: "📈 Popular Games",
              recent: "🕒 Recent Releases",
              seeAll: "See All"
            }
          },
          games: {
            title: "🎮 All Games",
            subtitle: "Discover amazing games from our extensive catalog",
            filters: {
              title: "Filters",
              clearAll: "Clear All",
              search: "Search Games",
              searchPlaceholder: "Search by name...",
              sortBy: "Sort By",
              genre: "Genre",
              platform: "Platform",
              allGenres: "All Genres",
              allPlatforms: "All Platforms"
            },
            sorting: {
              rating: "Highest Rated",
              newest: "Newest",
              oldest: "Oldest",
              nameAZ: "Name A-Z",
              nameZA: "Name Z-A",
              popular: "Most Popular"
            },
            results: {
              found: "Games Found",
              noGames: "No games found",
              noGamesSubtitle: "Try adjusting your filters or search terms",
              loading: "Loading games..."
            },
            common: {
              released: "Released"
            }
          },
          gameDetail: {
            loading: "Loading game details...",
            notFound: "Game Not Found",
            notFoundSubtitle: "The game you're looking for doesn't exist or has been removed.",
            backToGames: "Back to Games",
            description: "Description",
            screenshots: "Screenshots",
            gameInfo: "Game Information",
            releaseDate: "Release Date",
            developers: "Developers",
            publishers: "Publishers",
            playtime: "Average Playtime",
            hours: "hours",
            platforms: "Available Platforms",
            genres: "Genres"
          },
          common: {
            loading: "Loading...",
            released: "Released"
          }
        }
      },
      pt: {
        common: {
          app: {
            name: "Raykiro Games",
            tagline: "Descubra e Avalie os Melhores Jogos"
          },
          navigation: {
            home: "Início",
            games: "Jogos",
            reviews: "Avaliações",
            popular: "Populares",
            login: "Entrar",
            signup: "Cadastrar",
            search: "Buscar jogos..."
          },
          homepage: {
            hero: {
              title: "Bem-vindo Gamer!",
              titleHighlight: "",
              subtitle: "Descubra novos jogos, leia reviews e compartilhe suas experiências!",
              searchPlaceholder: "Buscar jogos, gêneros, plataformas...",
              searchButton: "Buscar",
              exploreGames: "Explorar Jogos",
              readReviews: "Ler Reviews"
            },
            stats: {
              games: "Jogos Catalogados",
              reviews: "Avaliações Publicadas",
              users: "Usuários Ativos"
            },
            popularGames: {
              title: "📈 Jogos Populares",
              viewAll: "Ver Todos",
              loading: "Carregando jogos populares..."
            },
            recentReleases: {
              title: "🕒 Lançamentos Recentes",
              viewAll: "Ver Todos",
              loading: "Carregando lançamentos recentes..."
            },
            news: {
              title: "Notícias de Games",
              loading: "Carregando notícias...",
              readMore: "Ler Mais",
              justNow: "agora",
              ago: "atrás",
              yesterday: "ontem"
            },
            sections: {
              popular: "📈 Jogos Populares",
              recent: "🕒 Lançamentos Recentes",
              seeAll: "Ver Todos"
            }
          },
          games: {
            title: "🎮 Todos os Jogos",
            subtitle: "Descubra jogos incríveis do nosso extenso catálogo",
            filters: {
              title: "Filtros",
              clearAll: "Limpar Tudo",
              search: "Buscar Jogos",
              searchPlaceholder: "Buscar por nome...",
              sortBy: "Ordenar Por",
              genre: "Gênero",
              platform: "Plataforma",
              allGenres: "Todos os Gêneros",
              allPlatforms: "Todas as Plataformas"
            },
            sorting: {
              rating: "Melhor Avaliados",
              newest: "Mais Novos",
              oldest: "Mais Antigos",
              nameAZ: "Nome A-Z",
              nameZA: "Nome Z-A",
              popular: "Mais Populares"
            },
            results: {
              found: "Jogos Encontrados",
              noGames: "Nenhum jogo encontrado",
              noGamesSubtitle: "Tente ajustar seus filtros ou termos de busca",
              loading: "Carregando jogos..."
            },
            common: {
              released: "Lançado"
            }
          },
          gameDetail: {
            loading: "Carregando detalhes do jogo...",
            notFound: "Jogo Não Encontrado",
            notFoundSubtitle: "O jogo que você está procurando não existe ou foi removido.",
            backToGames: "Voltar aos Jogos",
            description: "Descrição",
            screenshots: "Capturas de Tela",
            gameInfo: "Informações do Jogo",
            releaseDate: "Data de Lançamento",
            developers: "Desenvolvedores",
            publishers: "Editoras",
            playtime: "Tempo Médio de Jogo",
            hours: "horas",
            platforms: "Plataformas Disponíveis",
            genres: "Gêneros"
          },
          common: {
            loading: "Carregando...",
            released: "Lançado"
          }
        }
      },
      es: {
        common: {
          app: {
            name: "Raykiro Games",
            tagline: "Descubre y Califica los Mejores Juegos"
          },
          navigation: {
            home: "Inicio",
            games: "Juegos",
            reviews: "Reseñas",
            popular: "Populares",
            login: "Iniciar Sesión",
            signup: "Registrarse",
            search: "Buscar juegos..."
          },
          homepage: {
            hero: {
              title: "¡Bienvenido Gamer!",
              titleHighlight: "",
              subtitle: "Descubre nuevos juegos, comparte tus experiencias y lee reseñas detalladas!",
              searchPlaceholder: "Buscar juegos, géneros, plataformas...",
              searchButton: "Buscar",
              exploreGames: "Explorar Juegos",
              readReviews: "Leer Reseñas"
            },
            stats: {
              games: "Juegos Catalogados",
              reviews: "Reseñas Publicadas",
              users: "Usuarios Activos"
            },
            popularGames: {
              title: "📈 Juegos Populares",
              viewAll: "Ver Todos",
              loading: "Cargando juegos populares..."
            },
            recentReleases: {
              title: "🕒 Lanzamientos Recientes",
              viewAll: "Ver Todos",
              loading: "Cargando lanzamientos recientes..."
            },
            news: {
              title: "Noticias de Juegos",
              loading: "Cargando noticias...",
              readMore: "Leer Más",
              justNow: "ahora",
              ago: "atrás",
              yesterday: "ayer"
            },
            sections: {
              popular: "📈 Juegos Populares",
              recent: "🕒 Lanzamientos Recientes",
              seeAll: "Ver Todos"
            }
          },
          games: {
            title: "🎮 Todos los Juegos",
            subtitle: "Descubre juegos increíbles de nuestro extenso catálogo",
            filters: {
              title: "Filtros",
              clearAll: "Limpiar Todo",
              search: "Buscar Juegos",
              searchPlaceholder: "Buscar por nombre...",
              sortBy: "Ordenar Por",
              genre: "Género",
              platform: "Plataforma",
              allGenres: "Todos los Géneros",
              allPlatforms: "Todas las Plataformas"
            },
            sorting: {
              rating: "Mejor Calificados",
              newest: "Más Nuevos",
              oldest: "Más Antiguos",
              nameAZ: "Nombre A-Z",
              nameZA: "Nombre Z-A",
              popular: "Más Populares"
            },
            results: {
              found: "Juegos Encontrados",
              noGames: "No se encontraron juegos",
              noGamesSubtitle: "Intenta ajustar tus filtros o términos de búsqueda",
              loading: "Cargando juegos..."
            },
            common: {
              released: "Lanzado"
            }
          },
          gameDetail: {
            loading: "Cargando detalles del juego...",
            notFound: "Juego No Encontrado",
            notFoundSubtitle: "El juego que buscas no existe o ha sido eliminado.",
            backToGames: "Volver a Juegos",
            description: "Descripción",
            screenshots: "Capturas de Pantalla",
            gameInfo: "Información del Juego",
            releaseDate: "Fecha de Lanzamiento",
            developers: "Desarrolladores",
            publishers: "Editores",
            playtime: "Tiempo Promedio de Juego",
            hours: "horas",
            platforms: "Plataformas Disponibles",
            genres: "Géneros"
          },
          common: {
            loading: "Cargando...",
            released: "Lanzado"
          }
        }
      }
    }
  });

export default i18n;