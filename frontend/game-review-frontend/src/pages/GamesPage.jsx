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

  // Recent games
  useEffect(() => {
    const fetchRecentPopularGames = async () => {
      try {
        setLoadingRecent(true)
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/games/recent-popular?page_size=12`)
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

  // Genres + platforms
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/games/genres`)
        const data = await response.json()
        if (data.status === 'success') setGenres(data.genres)
      } catch (error) {
        console.error(error)
      }
    }

    const fetchPlatforms = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/games/platforms`)
        const data = await response.json()
        if (data.status === 'success') setPlatforms(data.platforms)
      } catch (error) {
        console.error(error)
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

      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()

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
      console.error(error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreGames = () => {
    if (!loadingMore && hasMore) fetchGames(false)
  }

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

  const hasActiveFilters = filters.genre || filters.platform || filters.search

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">{t('games.title')}</h1>
          <p className="text-xl opacity-90">{t('games.subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* filters */}
        <div className="mb-6 flex gap-4">
          <input
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search"
            className="border p-2"
          />

          <select
            value={filters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
          >
            <option value="">All Genres</option>
            {genres.map((g, i) => <option key={i}>{g}</option>)}
          </select>

          <select
            value={filters.platform}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
          >
            <option value="">All Platforms</option>
            {platforms.map((p, i) => <option key={i}>{p}</option>)}
          </select>
        </div>

        {/* grid */}
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
                  <img src={game.background_image} className="h-40 w-full object-cover" />
                  <h3>{game.name}</h3>
                </div>
              </Link>
            )
          })}
        </div>

        {loadingMore && <p>Loading...</p>}
        {!hasMore && <p>No more games</p>}
      </div>
    </div>
  )
}

export default GamesPage