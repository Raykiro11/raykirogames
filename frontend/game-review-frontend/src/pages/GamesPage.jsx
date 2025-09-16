import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

function GamesPage() {
  const { t } = useTranslation('common')
  const [games, setGames] = useState([])
  const [genres, setGenres] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalGames, setTotalGames] = useState(0)
  const [filters, setFilters] = useState({
    genre: '',
    platform: '',
    search: '',
    ordering: '-added'
  })

  const observer = useRef()
  const lastGameElementRef = useCallback(node => {
    if (loading || loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreGames()
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, loadingMore, hasMore])

  // Buscar gêneros da API RAWG
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('https://www.raykirogames/api/games/genres')
        const data = await response.json()
        if (data.status === 'success') {
          setGenres(data.genres)
        }
      } catch (error) {
        console.error(t('games.errors.fetchGenres'), error)
      }
    }

    const fetchPlatforms = async () => {
      try {
        const response = await fetch('https://www.raykirogames/api/games/genres')
        const data = await response.json()
        if (data.status === 'success') {
          setPlatforms(data.platforms)
        }
      } catch (error) {
        console.error(t('games.errors.fetchPlatforms'), error)
      }
    }

    fetchGenres()
    fetchPlatforms()
  }, [t])

  // Função para buscar jogos (primeira página ou reset)
  const fetchGames = async (resetGames = true) => {
    if (resetGames) {
      setLoading(true)
      setCurrentPage(1)
    } else {
      setLoadingMore(true)
    }

    try {
      let url = 'https://www.raykirogames/api/games/genres'
      const params = new URLSearchParams()

      if (filters.search) params.append('search', filters.search)
      if (filters.genre) params.append('genres', filters.genre)
      if (filters.platform) params.append('platforms', filters.platform)
      params.append('ordering', filters.ordering)
      params.append('page_size', '20')
      params.append('page', resetGames ? '1' : currentPage.toString())

      if (params.toString()) {
        url += '?' + params.toString()
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'success') {
        if (resetGames) {
          setGames(data.games)
          setCurrentPage(2)
        } else {
          const newGames = data.games.filter(newGame =>
            !games.some(existingGame => existingGame.id === newGame.id)
          )
          setGames(prevGames => [...prevGames, ...newGames])
          setCurrentPage(prev => prev + 1)
        }

        setTotalGames(data.total)
        const totalLoaded = resetGames ? data.games.length : games.length + data.games.length
        setHasMore(totalLoaded < data.total)
      }
    } catch (error) {
      console.error(t('games.errors.fetchGames'), error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Função para carregar mais jogos (scroll infinito)
  const loadMoreGames = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchGames(false)
    }
  }, [loadingMore, hasMore, currentPage, filters, games])

  // Buscar jogos quando filtros mudarem
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGames(true)
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [filters])
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setHasMore(true)
  }

  const clearFilters = () => {
    setFilters({
      genre: '',
      platform: '',
      search: '',
      ordering: '-added'
    })
    setHasMore(true)
  }

  const renderStars = (rating) => {
    const stars = Math.round(rating)
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  const GameCard = ({ game, index }) => {
    const isLast = index === games.length - 1

    return (
      <Link
        to={`/games/${game.id}`}
        className="block"
        ref={isLast ? lastGameElementRef : null}
      >
        <div className="card-shadow rounded-lg overflow-hidden bg-white hover:transform hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="h-48 bg-gray-200 overflow-hidden">
            {game.background_image ? (
              <img
                src={game.background_image}
                alt={game.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                🎮 {t('games.noImage')}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 truncate" title={game.name}>
              {game.name}
            </h3>
            <div className="flex items-center mb-2">
              <span className="text-yellow-500 text-sm">
                {renderStars(game.rating)}
              </span>
              <span className="ml-2 text-gray-600 text-sm">
                {game.rating}/5
              </span>
            </div>
            <p className="text-gray-600 text-sm truncate">
              {game.genres.join(', ') || t('games.genres.various')}
            </p>
            <p className="text-gray-500 text-xs mt-1 truncate">
              {game.platforms.slice(0, 3).join(', ')}
              {game.platforms.length > 3 && '...'}
            </p>
            {game.released && (
              <p className="text-gray-500 text-xs mt-1">
                {t('games.common.released')}: {new Date(game.released).getFullYear()}
              </p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('games.title')}</h1>
          <p className="text-gray-600">{t('games.subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('games.filters.title')}</h3>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t('games.filters.clearAll')}
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('games.filters.search')}
                </label>
                <input
                  type="text"
                  placeholder={t('games.filters.searchPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('games.filters.sortBy')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.ordering}
                  onChange={(e) => handleFilterChange('ordering', e.target.value)}
                >
                  <option value="-rating">{t('games.sorting.rating')}</option>
                  <option value="-released">{t('games.sorting.newest')}</option>
                  <option value="released">{t('games.sorting.oldest')}</option>
                  <option value="name">{t('games.sorting.nameAZ')}</option>
                  <option value="-name">{t('games.sorting.nameZA')}</option>
                  <option value="-added">{t('games.sorting.popular')}</option>
                </select>
              </div>
              {/* Genre Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('games.filters.genre')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                >
                  <option value="">{t('games.filters.allGenres')}</option>
                  {genres.map((genre, index) => (
                    <option key={index} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('games.filters.platform')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.platform}
                  onChange={(e) => handleFilterChange('platform', e.target.value)}
                >
                  <option value="">{t('games.filters.allPlatforms')}</option>
                  {platforms.map((platform, index) => (
                    <option key={index} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Filters */}
              <div className="space-y-2">
                {filters.search && (
                  <div className="flex items-center justify-between bg-blue-100 px-3 py-1 rounded-full text-sm">
                    <span>{t('games.filters.search')}: {filters.search}</span>
                    <button 
                      onClick={() => handleFilterChange('search', '')}
                      className="text-blue-600 hover:text-blue-800 ml-2"
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.genre && (
                  <div className="flex items-center justify-between bg-green-100 px-3 py-1 rounded-full text-sm">
                    <span>{t('games.filters.genre')}: {filters.genre}</span>
                    <button 
                      onClick={() => handleFilterChange('genre', '')}
                      className="text-green-600 hover:text-green-800 ml-2"
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.platform && (
                  <div className="flex items-center justify-between bg-purple-100 px-3 py-1 rounded-full text-sm">
                    <span>{t('games.filters.platform')}: {filters.platform}</span>
                    <button 
                      onClick={() => handleFilterChange('platform', '')}
                      className="text-purple-600 hover:text-purple-800 ml-2"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>{t('games.stats.loadedGames')}</span>
                    <span className="font-semibold">{games.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('games.stats.totalAvailable')}</span>
                    <span className="font-semibold">{totalGames.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Games Grid */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">{t('games.results.loading')}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {games.length} de {totalGames.toLocaleString()} {t('games.results.found')}
                  </h2>
                  {hasMore && (
                    <div className="text-sm text-gray-500">
                      {t('games.results.scrollLoad')}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {games.map((game, index) => (
                    <GameCard key={`${game.id}-${index}`} game={game} index={index} />
                  ))}
                </div>

                {/* Loading More Indicator */}
                {loadingMore && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600">{t('games.results.loadingMore')}</p>
                    </div>
                  </div>
                )}

                {/* End of Results */}
                {!hasMore && games.length > 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500">
                      🎮 {t('games.results.allGamesViewed', { count: games.length })}
                    </div>
                  </div>
                )}

                {games.length === 0 && !loading && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🎮</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('games.results.noGames')}</h3>
                    <p className="text-gray-600">{t('games.results.noGamesSubtitle')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GamesPage