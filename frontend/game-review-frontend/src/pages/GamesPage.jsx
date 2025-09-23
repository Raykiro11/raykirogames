import React, { useState, useEffect, useRef, useCallback } from 'react'
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
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/games/genres`)
        const data = await response.json()
        if (data.status === 'success') {
          setGenres(data.genres)
        }
      } catch (error) {
        console.error('Error fetching genres:', error)
      }
    }

    const fetchPlatforms = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/games/platforms`)
        const data = await response.json()
        if (data.status === 'success') {
          setPlatforms(data.platforms)
        }
      } catch (error) {
        console.error('Error fetching platforms:', error)
      }
    }

    fetchGenres()
    fetchPlatforms()
  }, [])

  const fetchGames = async (resetGames = true) => {
    try {
      if (resetGames) {
        setLoading(true)
        setCurrentPage(1)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams()
      let url = `${import.meta.env.VITE_API_BASE_URL}/games`
      
      params.append('page', resetGames ? '1' : currentPage.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.genre) params.append('genres', filters.genre)
      if (filters.platform) params.append('platforms', filters.platform)
      params.append('ordering', filters.ordering)
      params.append('page_size', '20')

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log('Fetching games from:', url) // Debug log

      const response = await fetch(url)
      const data = await response.json()

      console.log('Games response:', data) // Debug log

      if (data.status === 'success') {
        if (resetGames) {
          setGames(data.games)
          setCurrentPage(2)
        } else {
          setGames(prev => [...prev, ...data.games])
          setCurrentPage(prev => prev + 1)
        }
        setTotalGames(data.total)
        setHasMore(data.next)
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreGames = () => {
    if (!loadingMore && hasMore) {
      fetchGames(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGames(true)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [filters])

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      genre: '',
      platform: '',
      search: '',
      ordering: '-added'
    })
  }

  const hasActiveFilters = filters.genre || filters.platform || filters.search

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Games</h1>
          <p className="text-xl opacity-90">Discover amazing games</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Games
                </label>
                <input
                  type="text"
                  placeholder="Search for games..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Sort Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.ordering}
                  onChange={(e) => handleFilterChange('ordering', e.target.value)}
                >
                  <option value="-rating">Highest Rated</option>
                  <option value="-released">Newest</option>
                  <option value="released">Oldest</option>
                  <option value="name">Name A-Z</option>
                  <option value="-name">Name Z-A</option>
                  <option value="-added">Most Popular</option>
                </select>
              </div>

              {/* Genre Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                >
                  <option value="">All Genres</option>
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
                  Platform
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.platform}
                  onChange={(e) => handleFilterChange('platform', e.target.value)}
                >
                  <option value="">All Platforms</option>
                  {platforms.map((platform, index) => (
                    <option key={index} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Games Grid */}
          <div className="lg:col-span-3">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                  {filters.genre && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <span>Genre: {filters.genre}</span>
                      <button
                        onClick={() => handleFilterChange('genre', '')}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.platform && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <span>Platform: {filters.platform}</span>
                      <button
                        onClick={() => handleFilterChange('platform', '')}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.search && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <span>Search: {filters.search}</span>
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Results Info */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${totalGames} games found`}
              </p>
            </div>

            {/* Games Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                <span className="ml-4 text-gray-600">Loading games...</span>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎮</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No games found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game, index) => (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    ref={index === games.length - 1 ? lastGameElementRef : null}
                    className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="aspect-video bg-gray-200 overflow-hidden">
                      <img
                        src={game.background_image}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDQgNzJIMTc2VjEwNEgxNDRWNzJaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNTIgODBIMTY4Vjk2SDE1MlY4MFoiIGZpbGw9IiNGM0Y0RjYiLz4KPC9zdmc+Cg=='
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 truncate" title={game.name}>
                        {game.name}
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-yellow-500 text-sm">
                            {'★'.repeat(Math.round(game.rating))}{'☆'.repeat(5 - Math.round(game.rating))}
                          </span>
                          <span className="ml-2 text-gray-600 text-sm">{game.rating}/5</span>
                        </div>
                        {game.released && (
                          <span className="text-gray-500 text-sm">
                            {new Date(game.released).getFullYear()}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm truncate">
                        {game.genres.join(', ')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {loadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="ml-4 text-gray-600">Loading more games...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GamesPage