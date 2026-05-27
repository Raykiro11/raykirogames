import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

function GamesPage() {
  const { t } = useTranslation('common')

  const [games, setGames] = useState([])
  const [recentPopularGames, setRecentPopularGames] = useState([])
  const [genres, setGenres] = useState([])
  const [platforms, setPlatforms] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(true)
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

  // NEW: debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const observer = useRef()

  const lastGameElementRef = useCallback(
    node => {
      if (loading || loadingMore) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreGames()
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, loadingMore, hasMore]
  )

  // =========================
  // RECENT POPULAR GAMES
  // =========================
  useEffect(() => {
    const fetchRecentPopularGames = async () => {
      try {
        setLoadingRecent(true)

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/games/recent-popular?page_size=12`
        )

        const data = await response.json()

        if (data.status === 'success') {
          setRecentPopularGames(data.games)
        }
      } catch (error) {
        console.error('Error fetching recent popular games:', error)
      } finally {
        setLoadingRecent(false)
      }
    }

    fetchRecentPopularGames()
  }, [])

  // =========================
  // GENRES + PLATFORMS
  // =========================
  useEffect(() => {
    const fetchGenres = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/games/genres`)
      const data = await res.json()
      if (data.status === 'success') setGenres(data.genres)
    }

    const fetchPlatforms = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/games/platforms`)
      const data = await res.json()
      if (data.status === 'success') setPlatforms(data.platforms)
    }

    fetchGenres()
    fetchPlatforms()
  }, [])

  // =========================
  // DEBOUNCE SEARCH
  // =========================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 500)

    return () => clearTimeout(timer)
  }, [filters.search])

  // =========================
  // FETCH GAMES
  // =========================
  const fetchGames = async (reset = false, pageOverride = null) => {
    try {
      if (reset) {
        setLoading(true)
        setCurrentPage(1)
      } else {
        setLoadingMore(true)
      }

      const page = pageOverride || currentPage

      const params = new URLSearchParams()

      params.append('page', reset ? '1' : page.toString())
      params.append('page_size', '20')
      params.append('ordering', filters.ordering)

      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filters.genre) params.append('genres', filters.genre)
      if (filters.platform) params.append('platforms', filters.platform)

      const url = `${import.meta.env.VITE_API_BASE_URL}/games?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'success') {
        if (reset) {
          setGames(data.games)
          setCurrentPage(2)
        } else {
          setGames(prev => {
            const combined = [...prev, ...data.games]

            // remove duplicates
            const unique = Array.from(
              new Map(combined.map(g => [g.id, g])).values()
            )

            return unique
          })

          setCurrentPage(prev => prev + 1)
        }

        setTotalGames(data.total)
        setHasMore(data.next)
      }
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // =========================
  // LOAD MORE
  // =========================
  const loadMoreGames = () => {
    if (!loadingMore && hasMore) {
      fetchGames(false)
    }
  }

  // =========================
  // RESET ON FILTER CHANGE
  // =========================
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchGames(true)
    }, 300)

    return () => clearTimeout(timeout)
  }, [debouncedSearch, filters.genre, filters.platform, filters.ordering])

  // =========================
  // HANDLERS
  // =========================
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
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

  const hasActiveFilters =
    filters.genre || filters.platform || filters.search

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <h1 className="text-4xl font-bold mb-6">
          {t('games.title')}
        </h1>

        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap">

          <input
            type="text"
            placeholder={t('games.filters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="border p-2 rounded w-64"
          />

          <select
            value={filters.ordering}
            onChange={(e) => handleFilterChange('ordering', e.target.value)}
            className="border p-2 rounded"
          >
            <option value="-added">Most Popular</option>
            <option value="-released">Newest</option>
            <option value="name">Name A-Z</option>
            <option value="-rating">Top Rated</option>
          </select>

          <select
            value={filters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All Genres</option>
            {genres.map((g, i) => (
              <option key={i} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={filters.platform}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All Platforms</option>
            {platforms.map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-red-500"
            >
              Clear
            </button>
          )}

        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {games.map((game, index) => {
            const isLast = index === games.length - 1

            return (
              <Link
                key={game.id}
                to={`/games/${game.id}`}
                ref={isLast ? lastGameElementRef : null}
              >
                <div className="bg-white rounded shadow overflow-hidden">

                  <img
                    src={game.background_image}
                    alt={game.name}
                    className="w-full h-40 object-cover"
                  />

                  <div className="p-2">
                    <h3 className="font-semibold truncate">
                      {game.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ⭐ {game.rating || 'N/A'}
                    </p>
                  </div>

                </div>
              </Link>
            )
          })}

        </div>

        {/* Loading */}
        {loadingMore && (
          <p className="text-center mt-6">
            Loading more games...
          </p>
        )}

        {/* End */}
        {!hasMore && (
          <p className="text-center mt-6 text-gray-500">
            No more games
          </p>
        )}

      </div>
    </div>
  )
}

export default GamesPage