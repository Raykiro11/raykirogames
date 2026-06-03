import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { fetchPopularGames, fetchRecentGames, fetchNews, fetchConsoleNews } from '../lib/api'
import { format } from 'date-fns'
import { pt, enUS, es } from 'date-fns/locale'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

function HomePage() {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()

  const [popularGames, setPopularGames] = useState([])
  const [recentGames, setRecentGames] = useState([])
  const [consoleNews, setConsoleNews] = useState([])

  const [loadingGames, setLoadingGames] = useState(true)
  const [loadingNews, setLoadingNews] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const searchRef = useRef(null)
  const searchResultsRef = useRef(null)

  const popularGamesRef = useRef(null)
  const recentGamesRef = useRef(null)
  const newsRef = useRef(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingGames(true)
        setLoadingNews(true)

        const [popularData, recentData, consoleNewsData] =
          await Promise.all([
            fetchPopularGames(1, 20),
            fetchRecentGames(1, 20),
            fetchConsoleNews()
          ])

        if (popularData.status === 'success') {
          setPopularGames(popularData.games)
        }

        if (recentData.status === 'success') {
          setRecentGames(recentData.games)
        }

        if (consoleNewsData.status === 'ok') {
          setConsoleNews(consoleNewsData.articles || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingGames(false)
        setLoadingNews(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const searchGames = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        setShowSearchResults(false)
        return
      }

      setSearchLoading(true)

      try {
        const res = await fetch(
          `${API_BASE_URL}/games?search=${encodeURIComponent(
            searchQuery.trim()
          )}&page_size=8`
        )

        const data = await res.json()

        if (data.status === 'success') {
          setSearchResults(data.games)
          setShowSearchResults(true)
        }
      } catch (err) {
        console.error(err)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }

    const t = setTimeout(searchGames, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(e.target)
      ) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () =>
      document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchInputChange = (e) =>
    setSearchQuery(e.target.value)

  const handleSearchResultClick = (id) => {
    setShowSearchResults(false)
    setSearchQuery('')
    navigate(`/games/${id}`)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(
        `/games?search=${encodeURIComponent(searchQuery.trim())}`
      )
    }
  }
    const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Data não disponível'

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Data inválida'

    const now = new Date()
    const diffInHours = Math.floor(
      (now - date) / (1000 * 60 * 60)
    )

    const locale =
      i18n.language === 'pt'
        ? pt
        : i18n.language === 'es'
        ? es
        : enUS

    if (diffInHours < 1)
      return t('homepage.news.justNow')
    if (diffInHours < 24)
      return `${diffInHours}h ${t('homepage.news.ago')}`
    if (diffInHours < 48)
      return t('homepage.news.yesterday')

    return format(date, 'dd MMM', { locale })
  }

  const getGameYear = (dateString) => {
    if (!dateString || dateString === 'TBD') return 'TBA'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'TBA'
    return date.getFullYear()
  }

  const isNewGame = (dateString) => {
    if (!dateString || dateString === 'TBD') return false
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return false
    return date.getFullYear() >= 2024
  }

  const scrollLeft = (ref) => {
    if (ref.current)
      ref.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      })
  }

  const scrollRight = (ref) => {
    if (ref.current)
      ref.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      })
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO SECTION (UPDATED BLUE THEME) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-900 via-blue-800 to-cyan-700 text-white">

        {/* subtle background glow */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_60%)]"></div>

        <div className="container mx-auto px-4 py-28 relative z-10">
          <div className="text-center max-w-4xl mx-auto">

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
              {t('homepage.hero.title')}{' '}
              {t('homepage.hero.titleHighlight')}
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              {t('homepage.hero.subtitle')}
            </p>

            {/* SEARCH */}
            <div className="relative max-w-2xl mx-auto mb-8">

              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={t(
                    'homepage.hero.searchPlaceholder'
                  )}
                  className="w-full px-6 py-4 text-lg rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() =>
                    searchQuery.trim().length >= 2 &&
                    setShowSearchResults(true)
                  }
                />

                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full transition-all duration-200 shadow-lg"
                >
                  🔍 {t('homepage.hero.searchButton')}
                </button>
              </form>

              {/* SEARCH RESULTS */}
              {showSearchResults && (
                <div
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
                >
                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((game) => (
                        <button
                          key={game.id}
                          onClick={() =>
                            handleSearchResultClick(game.id)
                          }
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                        >
                          <img
                            src={
                              game.background_image ||
                              'data:image/svg+xml;base64,...'
                            }
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {game.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {game.genres?.slice(0, 2).join(', ')} •{' '}
                              {getGameYear(game.released)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No results
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* HERO BUTTONS (IMPROVED BLUE STYLE) */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/games"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
              >
                {t('homepage.hero.exploreGames')}
              </Link>

              <Link
                to="/reviews"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105"
              >
                {t('homepage.hero.readReviews')}
              </Link>
            </div>
              // =========================
  // FORMAT NEWS TIME
  // =========================
  const formatTimeAgo = (dateString) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const now = new Date()
    const diff = Math.floor((now - date) / (1000 * 60 * 60))

    if (diff < 1) return 'Just now'
    if (diff < 24) return `${diff}h ago`
    if (diff < 48) return 'Yesterday'

    return format(date, 'dd MMM', { locale: enUS })
  }

  const isNewGame = (date) => {
    if (!date) return false
    const d = new Date(date)
    return !isNaN(d) && d.getFullYear() >= 2024
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO (BLUE ONLY - NO PURPLE) */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-20 text-center">

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {t('homepage.hero.title')}
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-10">
            {t('homepage.hero.subtitle')}
          </p>

          {/* SEARCH */}
          <div className="relative max-w-2xl mx-auto mb-10">

            <form onSubmit={handleSearchSubmit}>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('homepage.hero.searchPlaceholder')}
                className="w-full px-6 py-4 rounded-full text-black focus:outline-none focus:ring-4 focus:ring-blue-400"
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              />
            </form>

            {showSearchResults && (
              <div
                ref={searchResultsRef}
                className="absolute w-full mt-2 bg-white text-black rounded-xl shadow-lg max-h-96 overflow-auto z-50"
              >
                {searchLoading ? (
                  <div className="p-4 text-center">Loading...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleSearchClick(g.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 flex gap-3"
                    >
                      <img
                        src={g.background_image}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-semibold truncate">{g.name}</div>
                        <div className="text-sm text-gray-500">
                          {getYear(g.released)}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No results
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BUTTONS */}
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              to="/games"
              className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full font-bold"
            >
              Explore Games
            </Link>

            <Link
              to="/reviews"
              className="bg-white/10 border border-white/30 px-6 py-3 rounded-full"
            >
              Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* POPULAR */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">

          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Popular Games
          </h2>

          <div ref={popularGamesRef} className="flex gap-6 overflow-x-auto">

            {loadingGames ? (
              <p>Loading...</p>
            ) : (
              popularGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="min-w-[220px] bg-white rounded-lg shadow hover:scale-105 transition"
                >
                  <img
                    src={game.background_image}
                    className="h-40 w-full object-cover rounded-t-lg"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold truncate">
                      {game.name}
                    </h3>
                  </div>
                </Link>
              ))
            )}

          </div>
        </div>
      </section>

      {/* RECENT */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">

          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Recent Releases
          </h2>

          <div ref={recentGamesRef} className="flex gap-6 overflow-x-auto">

            {recentGames.map((game) => (
              <div
                key={game.id}
                className="min-w-[220px] bg-white rounded-lg shadow"
              >
                <img
                  src={game.background_image}
                  className="h-40 w-full object-cover rounded-t-lg"
                />

                <div className="p-3">
                  <h3 className="font-semibold truncate">
                    {game.name}
                  </h3>

                  {isNewGame(game.released) && (
                    <span className="text-xs text-blue-600 font-bold">
                      NEW
                    </span>
                  )}
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* NEWS */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">

          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Gaming News
          </h2>

          <div ref={newsRef} className="flex gap-6 overflow-x-auto">

            {consoleNews.map((n, i) => (
              <div
                key={i}
                className="min-w-[300px] bg-white shadow rounded-lg overflow-hidden"
              >
                <img
                  src={n.urlToImage}
                  className="h-40 w-full object-cover"
                />

                <div className="p-4">
                  <h3 className="font-bold text-sm mb-2">
                    {n.title}
                  </h3>

                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(n.publishedAt)}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

    </div>
  )
}

export default HomePage