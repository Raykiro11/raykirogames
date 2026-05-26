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

  // =========================
  // RECENT GAMES
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
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/games/genres`)
        const data = await res.json()
        if (data.status === 'success') setGenres(data.genres)
      } catch (e) {
        console.error(e)
      }
    }

    const fetchPlatforms = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/games/platforms`)
        const data = await res.json()
        if (data.status === 'success') setPlatforms(data.platforms)
      } catch (e) {
        console.error(e)
      }
    }

    fetchGenres()
    fetchPlatforms()
  }, [])

  // =========================
  // FETCH GAMES
  // =========================
  const fetchGames = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true)
        setCurrentPage(1)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams()

      params.append('page', reset ? '1' : currentPage.toString())
      params.append('page_size', '20')
      params.append('ordering', filters.ordering)

      if (filters.search) params.append('search', filters.search)

      // 🔥 FIX: RAWG expects SLUGS, not display names
      if (filters.genre) {
        params.append('genres', filters.genre.toLowerCase())
      }

      if (filters.platform) {
        params.append('platforms', filters.platform.toLowerCase())
      }

      const url = `${import.meta.env.VITE_API_BASE_URL}/games?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'success') {
        if (reset) {
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
      console.error(error)
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

  // =========================
  // REFRESH ON FILTER CHANGE
  // =========================
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchGames(true)
    }, 300)

    return () => clearTimeout(timeout)
  }, [filters])

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }))
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

        {/* FILTERS */}
        <div className="mb-6 flex gap-4 flex-wrap">

          <input
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search games..."
            className="border p-2"
          />

          <select
            value={filters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
          >
            <option value="">All Genres</option>
            {genres.map((g, i) => (
              <option key={i} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={filters.platform}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
          >
            <option value="">All Platforms</option>
            {platforms.map((p, i) => (
              <option key={i} value={p}>
                {p}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {games.map((game, index) => {
            const isLast = index === games.length - 1

            return (
              <Link
                key={game.id}
                to={`/games/${game.id}`}
                ref={isLast ? lastGameElementRef : null}
              >
                <div className="bg-white p-2">
                  <img
                    src={game.background_image}
                    className="h-40 w-full object-cover"
                  />
                  <h3>{game.name}</h3>
                </div>
              </Link>
            )
          })}
        </div>

        {/* STATES */}
        {loadingMore && <p>Loading...</p>}
        {!hasMore && <p>No more games</p>}

      </div>
    </div>
  )
}

export default GamesPage