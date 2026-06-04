import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchPopularGames,
  fetchRecentGames,
  fetchNews,
  fetchConsoleNews
} from '../lib/api'
import { format } from 'date-fns'
import { pt, enUS, es } from 'date-fns/locale'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

function HomePage() {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()

  const [popularGames, setPopularGames] = useState([])
  const [recentGames, setRecentGames] = useState([])
  const [gamingNews, setGamingNews] = useState([])
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

        const [
          popularData,
          recentData,
          newsData,
          consoleNewsData
        ] = await Promise.all([
          fetchPopularGames(1, 20),
          fetchRecentGames(1, 20),
          fetchNews(),
          fetchConsoleNews()
        ])

        if (popularData?.status === 'success') {
          setPopularGames(popularData.games || [])
        }

        if (recentData?.status === 'success') {
          setRecentGames(recentData.games || [])
        }

        if (newsData?.status === 'success') {
          setGamingNews(newsData.news || [])
        }

        if (consoleNewsData?.status === 'ok') {
          setConsoleNews(consoleNewsData.articles || [])
        }
      } catch (error) {
        console.error('Error loading homepage data:', error)
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
        const response = await fetch(
          `${API_BASE_URL}/games?search=${encodeURIComponent(
            searchQuery.trim()
          )}&page_size=8`
        )

        const data = await response.json()

        if (data?.status === 'success') {
          setSearchResults(data.games || [])
          setShowSearchResults(true)
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }

    const timeoutId = setTimeout(searchGames, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
  }, [])

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchResultClick = (gameId) => {
    setShowSearchResults(false)
    setSearchQuery('')
    navigate(`/games/${gameId}`)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()

    if (searchQuery.trim()) {
      setShowSearchResults(false)
      navigate(
        `/games?search=${encodeURIComponent(
          searchQuery.trim()
        )}`
      )
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Date unavailable'

    const date = new Date(dateString)

    if (isNaN(date.getTime())) return 'Invalid date'

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

    if (diffInHours < 1) {
      return t('homepage.news.justNow')
    }

    if (diffInHours < 24) {
      return `${diffInHours}h ${t('homepage.news.ago')}`
    }

    if (diffInHours < 48) {
      return t('homepage.news.yesterday')
    }

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
    if (ref.current) {
      ref.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: 320,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 text-white">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center max-w-5xl mx-auto">

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-cyan-300 to-blue-100 bg-clip-text text-transparent">
              {t('homepage.hero.title')} {t('homepage.hero.titleHighlight')}
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-10">
              {t('homepage.hero.subtitle')}
            </p>

            {/* SEARCH */}
            <div className="relative max-w-3xl mx-auto mb-10">

              <form
                onSubmit={handleSearchSubmit}
                className="relative"
              >
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() =>
                    searchQuery.trim().length >= 2 &&
                    setShowSearchResults(true)
                  }
                  placeholder={t(
                    'homepage.hero.searchPlaceholder'
                  )}
                  className="w-full px-7 py-5 text-lg rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                />

                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-7 rounded-full font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-900 transition-all"
                >
                  🔍 {t('homepage.hero.searchButton')}
                </button>
              </form>

              {showSearchResults && (
                <div
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto z-50"
                >
                  {searchLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-3"></div>
                      <span className="text-slate-500">
                        Searching games...
                      </span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((game) => (
                        <button
                          key={game.id}
                          onClick={() =>
                            handleSearchResultClick(game.id)
                          }
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <img
                            src={game.background_image}
                            alt={game.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 truncate">
                              {game.name}
                            </div>

                            <div className="text-sm text-slate-500 truncate">
                              {game.genres
                                ?.slice(0, 2)
                                ?.join(', ')}{' '}
                              • {getGameYear(game.released)}
                            </div>
                          </div>

                          <div className="text-yellow-500 text-sm">
                            ★ {game.rating || 'N/A'}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500">
                      <div className="text-5xl mb-2">🎮</div>
                      <div>
                        No games found for "{searchQuery}"
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/games"
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold py-3 px-8 rounded-full transition-all hover:scale-105"
              >
                {t('homepage.hero.exploreGames')}
              </Link>

              <Link
                to="/reviews"
                className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105"
              >
                {t('homepage.hero.readReviews')}
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* POPULAR GAMES */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-bold text-slate-800">
              {t('homepage.sections.popular')}
            </h2>

            <Link
              to="/games"
              className="font-semibold text-cyan-600 hover:text-cyan-700"
            >
              {t('homepage.popularGames.viewAll')} →
            </Link>
          </div>

          {loadingGames ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <div className="relative">

              <button
                onClick={() => scrollLeft(popularGamesRef)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3"
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
                    className="flex-shrink-0 w-64 group"
                  >
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all">
                      <div className="h-52 overflow-hidden">
                        <img
                          src={game.background_image}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-lg truncate">
                          {game.name}
                        </h3>

                        <div className="mt-2 text-yellow-500">
                          ★ {game.rating}
                        </div>

                        <div className="mt-2 text-sm text-slate-500 truncate">
                          {game.genres?.join(', ')}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <button
                onClick={() => scrollRight(popularGamesRef)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3"
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </section>
            {/* RECENT RELEASES */}
      <section className="py-20 bg-slate-100">
        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-bold text-slate-800">
              {t('homepage.recentReleases.title')}
            </h2>

            <Link
              to="/games?ordering=-released"
              className="font-semibold text-cyan-600 hover:text-cyan-700"
            >
              {t('homepage.recentReleases.viewAll')} →
            </Link>
          </div>

          {loadingGames ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <div className="relative">

              <button
                onClick={() => scrollLeft(recentGamesRef)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3"
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
                    className="flex-shrink-0 w-64 group"
                  >
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all">

                      <div className="h-52 overflow-hidden relative">
                        <img
                          src={game.background_image}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />

                        {isNewGame(game.released) && (
                          <div className="absolute top-3 left-3 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            NEW
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3
                          className="font-bold text-lg truncate"
                          title={game.name}
                        >
                          {game.name}
                        </h3>

                        <div className="flex justify-between items-center mt-2">
                          <span className="text-yellow-500">
                            ★ {game.rating}
                          </span>

                          <span className="text-slate-500 text-sm">
                            {getGameYear(game.released)}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-slate-500 truncate">
                          {game.genres?.join(', ')}
                        </div>
                      </div>

                    </div>
                  </Link>
                ))}
              </div>

              <button
                onClick={() => scrollRight(recentGamesRef)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3"
              >
                ▶
              </button>

            </div>
          )}
        </div>
      </section>

      {/* NEWS SECTION */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-bold text-slate-800">
              {t('homepage.news.title')}
            </h2>

            <Link
              to="/news"
              className="font-semibold text-cyan-600 hover:text-cyan-700"
            >
              {t('homepage.news.viewAll')} →
            </Link>
          </div>

          {loadingNews ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <div className="relative">

              <button
                onClick={() => scrollLeft(newsRef)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3"
              >
                ◀
              </button>

              <div
                ref={newsRef}
                className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
              >
                {consoleNews.slice(0, 10).map((article, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-80"
                  >
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all">

                      <div className="h-52 overflow-hidden">
                        <img
                          src={
                            article.urlToImage ||
                            'data:image/svg+xml;base64,...'
                          }
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              'data:image/svg+xml;base64,...'
                          }}
                        />
                      </div>

                      <div className="p-6">

                        <div className="flex justify-between items-center mb-3">
                          <span className="text-cyan-600 text-sm font-semibold">
                            {article.source?.name}
                          </span>

                          <span className="text-slate-500 text-sm">
                            {formatTimeAgo(article.publishedAt)}
                          </span>
                        </div>

                        <h3 className="font-bold text-lg text-slate-800 mb-3 line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                          {article.description}
                        </p>

                        <button
                          onClick={() =>
                            window.open(
                              `https://www.google.com/search?q=${encodeURIComponent(
                                article.title
                              )}`,
                              '_blank'
                            )
                          }
                          className="text-cyan-600 hover:text-cyan-700 font-semibold"
                        >
                          {t('homepage.news.readMore')} →
                        </button>

                      </div>

                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRight(newsRef)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3"
              >
                ▶
              </button>
                          </div>
          )}
        </div>
      </section>

    </div>
  )
}

export default HomePage