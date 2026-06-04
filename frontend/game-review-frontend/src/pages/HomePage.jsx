import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { fetchPopularGames, fetchRecentGames, fetchNews, fetchConsoleNews } from '../lib/api'
import { format } from 'date-fns'
import { pt, enUS, es } from 'date-fns/locale'

// API base
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

function HomePage() {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()

  // ===== DATA STATE =====
  const [popularGames, setPopularGames] = useState([])
  const [recentGames, setRecentGames] = useState([])
  const [gamingNews, setGamingNews] = useState([])
  const [consoleNews, setConsoleNews] = useState([])

  const [loadingGames, setLoadingGames] = useState(true)
  const [loadingNews, setLoadingNews] = useState(true)

  // ===== SEARCH STATE =====
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const searchRef = useRef(null)
  const searchResultsRef = useRef(null)

  // ===== SCROLL REFS =====
  const popularGamesRef = useRef(null)
  const recentGamesRef = useRef(null)
  const newsRef = useRef(null)

  // ===== LOAD DATA =====
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingGames(true)
        setLoadingNews(true)

        const [popularData, recentData, newsData, consoleNewsData] = await Promise.all([
          fetchPopularGames(1, 20),
          fetchRecentGames(1, 20),
          fetchNews(),
          fetchConsoleNews()
        ])

        if (popularData.status === 'success') setPopularGames(popularData.games || [])
        if (recentData.status === 'success') setRecentGames(recentData.games || [])
        if (newsData.status === 'success') setGamingNews(newsData.news || [])
        if (consoleNewsData.status === 'ok') setConsoleNews(consoleNewsData.articles || [])

      } catch (err) {
        console.error('Error loading homepage data:', err)
      } finally {
        setLoadingGames(false)
        setLoadingNews(false)
      }
    }

    loadData()
  }, [])

  // ===== SEARCH (debounced) =====
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
          `${API_BASE_URL}/games?search=${encodeURIComponent(searchQuery.trim())}&page_size=8`
        )
        const data = await res.json()

        if (data.status === 'success') {
          setSearchResults(data.games || [])
          setShowSearchResults(true)
        } else {
          setSearchResults([])
        }
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }

    const timeout = setTimeout(searchGames, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  // ===== CLICK OUTSIDE SEARCH =====
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ===== HANDLERS =====
  const handleSearchInputChange = (e) => setSearchQuery(e.target.value)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearchResults(false)
      navigate(`/games?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSearchResultClick = (id) => {
    setShowSearchResults(false)
    setSearchQuery('')
    navigate(`/games/${id}`)
  }

  // ===== HELPERS =====
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'

    const now = new Date()
    const diff = Math.floor((now - date) / (1000 * 60 * 60))

    const locale =
      i18n.language === 'pt' ? pt :
      i18n.language === 'es' ? es : enUS

    if (diff < 1) return t('homepage.news.justNow')
    if (diff < 24) return `${diff}h ${t('homepage.news.ago')}`
    if (diff < 48) return t('homepage.news.yesterday')

    return format(date, 'dd MMM', { locale })
  }

  const getGameYear = (date) => {
    if (!date || date === 'TBD') return 'TBA'
    const d = new Date(date)
    return isNaN(d.getTime()) ? 'TBA' : d.getFullYear()
  }

  const isNewGame = (date) => {
    if (!date || date === 'TBD') return false
    const d = new Date(date)
    return !isNaN(d.getTime()) && d.getFullYear() >= 2024
  }

  const scrollLeft = (ref) => {
    ref.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  const scrollRight = (ref) => {
    ref.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }
  
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ===================== */}
      {/* HERO SECTION (BLUE THEME) */}
      {/* ===================== */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white">

        <div className="container mx-auto px-4 py-20">

          <div className="text-center max-w-4xl mx-auto">

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('homepage.hero.title')}{" "}
              <span className="text-yellow-300">
                {t('homepage.hero.titleHighlight')}
              </span>
            </h1>

            <p className="text-xl md:text-2xl mb-10 text-white/80">
              {t('homepage.hero.subtitle')}
            </p>

            {/* SEARCH */}
            <div className="relative max-w-2xl mx-auto mb-8">

              <form onSubmit={handleSearchSubmit} className="relative">

                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() =>
                    searchQuery.trim().length >= 2 && setShowSearchResults(true)
                  }
                  placeholder={t('homepage.hero.searchPlaceholder')}
                  className="w-full px-6 py-4 rounded-full text-black focus:outline-none"
                />

                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                >
                  🔍 {t('homepage.hero.searchButton')}
                </button>

              </form>

              {/* SEARCH DROPDOWN */}
              {showSearchResults && (
                <div
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white text-black rounded-xl shadow-xl max-h-96 overflow-y-auto z-50"
                >

                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => handleSearchResultClick(game.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100"
                      >

                        <img
                          src={game.background_image}
                          className="w-10 h-10 rounded object-cover"
                        />

                        <div className="flex-1 text-left">
                          <p className="font-medium">{game.name}</p>
                          <p className="text-xs text-gray-500">
                            {game.genres?.slice(0, 2).join(', ')} • {getGameYear(game.released)}
                          </p>
                        </div>

                        <span className="text-yellow-500 text-sm">
                          ★ {game.rating || 'N/A'}
                        </span>

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
            <div className="flex flex-wrap justify-center gap-4">

              <Link
                to="/games"
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-full"
              >
                {t('homepage.hero.exploreGames')}
              </Link>

              <Link
                to="/reviews"
                className="bg-white/10 hover:bg-white/20 border border-white/30 px-8 py-3 rounded-full"
              >
                {t('homepage.hero.readReviews')}
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* ===================== */}
      {/* POPULAR GAMES */}
      {/* ===================== */}
      <section className="py-16">

        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-3xl font-bold text-slate-800">
              Popular Games
            </h2>

            <Link to="/games" className="text-blue-600">
              View all →
            </Link>

          </div>

          {loadingGames ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <div className="relative">

              <button
                onClick={() => scrollLeft(popularGamesRef)}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full"
              >
                ◀
              </button>

              <div
                ref={popularGamesRef}
                className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
              >

                {popularGames.map((game) => (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    className="w-60 flex-shrink-0 bg-white rounded-xl shadow hover:shadow-lg transition"
                  >

                    <img
                      src={game.background_image}
                      className="h-40 w-full object-cover"
                    />

                    <div className="p-3">
                      <p className="font-semibold truncate">{game.name}</p>
                      <p className="text-sm text-yellow-500">
                        ★ {game.rating}
                      </p>
                    </div>

                  </Link>
                ))}

              </div>

              <button
                onClick={() => scrollRight(popularGamesRef)}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full"
              >
                ▶
              </button>

            </div>
          )}

        </div>

      </section>
      
      {/* ===================== */}
      {/* TRENDING GAMES (FIXED - NOT DUPLICATED) */}
      {/* ===================== */}
      <section className="py-16 bg-slate-100">

        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-3xl font-bold text-slate-800">
              Trending Now
            </h2>

          </div>

          <div className="relative">

            <button
              onClick={() => scrollLeft(trendingRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full z-10"
            >
              ◀
            </button>

            <div
              ref={trendingRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
            >

              {[...recentGames]
                .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // FIX: different logic from popular
                .slice(0, 10)
                .map((game) => (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    className="w-60 flex-shrink-0 bg-white rounded-xl shadow hover:shadow-lg transition"
                  >

                    <img
                      src={game.background_image}
                      className="h-40 w-full object-cover"
                    />

                    <div className="p-3">
                      <p className="font-semibold truncate">{game.name}</p>
                      <p className="text-sm text-gray-500">
                        ⭐ {game.rating || 'N/A'}
                      </p>
                    </div>

                  </Link>
                ))}

            </div>

            <button
              onClick={() => scrollRight(trendingRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full"
            >
              ▶
            </button>

          </div>

        </div>

      </section>

      {/* ===================== */}
      {/* RECENT RELEASES */}
      {/* ===================== */}
      <section className="py-16 bg-white">

        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-3xl font-bold text-slate-800">
              Recent Releases
            </h2>

          </div>

          <div className="relative">

            <button
              onClick={() => scrollLeft(recentGamesRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full z-10"
            >
              ◀
            </button>

            <div
              ref={recentGamesRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
            >

              {recentGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="w-60 flex-shrink-0 bg-white rounded-xl shadow hover:shadow-lg transition"
                >

                  <img
                    src={game.background_image}
                    className="h-40 w-full object-cover"
                  />

                  <div className="p-3">
                    <p className="font-semibold truncate">{game.name}</p>
                    <p className="text-sm text-gray-500">
                      {getGameYear(game.released)}
                    </p>
                  </div>

                </Link>
              ))}

            </div>

            <button
              onClick={() => scrollRight(recentGamesRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full"
            >
              ▶
            </button>

          </div>

        </div>

      </section>

      {/* ===================== */}
      {/* NEWS SECTION */}
      {/* ===================== */}
      <section className="py-16 bg-slate-100">

        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-3xl font-bold text-slate-800">
              Gaming News
            </h2>

          </div>

          <div className="relative">

            <button
              onClick={() => scrollLeft(newsRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full"
            >
              ◀
            </button>

            <div
              ref={newsRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
            >

              {consoleNews.slice(0, 10).map((article, i) => (
                <div
                  key={i}
                  className="w-80 flex-shrink-0 bg-white rounded-xl shadow hover:shadow-lg transition"
                >

                  <img
                    src={article.urlToImage}
                    className="h-40 w-full object-cover"
                  />

                  <div className="p-4">

                    <p className="text-xs text-blue-600 mb-2">
                      {article.source?.name}
                    </p>

                    <h3 className="font-semibold text-sm line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-xs text-gray-500 mt-2">
                      {formatTimeAgo(article.publishedAt)}
                    </p>

                  </div>

                </div>
              ))}

            </div>

            <button
              onClick={() => scrollRight(newsRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow p-2 rounded-full"
            >
              ▶
            </button>

          </div>

        </div>

      </section>
      
      {/* ===================== */}
      {/* LOADING STATES (FINAL CLEAN) */}
      {/* ===================== */}
      {loadingGames && (
        <div className="text-center py-10 text-slate-500">
          Loading games...
        </div>
      )}

      {loadingNews && (
        <div className="text-center py-10 text-slate-500">
          Loading news...
        </div>
      )}

    </div>
  )
}

export default HomePage