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

  const [trendingGames, setTrendingGames] = useState([])
  const [topRatedGames, setTopRatedGames] = useState([])

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
  const trendingRef = useRef(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingGames(true)
        setLoadingNews(true)

        const [popularData, recentData, newsData, consoleNewsData] =
          await Promise.all([
            fetchPopularGames(1, 20),
            fetchRecentGames(1, 20),
            fetchNews(),
            fetchConsoleNews()
          ])

        const popular = popularData.games || []
        const recent = recentData.games || []

        setPopularGames(popular)
        setRecentGames(recent)

        // 🔥 Trending (based on rating)
        const trending = [...popular]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10)
        setTrendingGames(trending)

        // ⭐ Top rated
        const topRated = [...recent]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10)
        setTopRatedGames(topRated)

        if (consoleNewsData.status === 'ok') {
          setConsoleNews(consoleNewsData.articles || [])
        }
      } catch (err) {
        console.error('Error loading data:', err)
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
            searchQuery
          )}&page_size=8`
        )
        const data = await res.json()

        if (data.status === 'success') {
          setSearchResults(data.games || [])
          setShowSearchResults(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setSearchLoading(false)
      }
    }

    const t = setTimeout(searchGames, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/games?search=${encodeURIComponent(searchQuery)}`)
  }

  const formatYear = (date) => {
    if (!date) return 'TBA'
    const d = new Date(date)
    return isNaN(d.getTime()) ? 'TBA' : d.getFullYear()
  }

  const scroll = (ref, dir) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: dir * 300,
        behavior: 'smooth'
      })
    }
  }
    return (
    <div className="min-h-screen bg-slate-50">

      {/* HERO SECTION - BLUE THEME */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-20">

          <div className="text-center max-w-4xl mx-auto">

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              {t('homepage.hero.title')}
            </h1>

            <p className="text-lg md:text-2xl mb-10 text-slate-200">
              {t('homepage.hero.subtitle')}
            </p>

            {/* SEARCH BAR */}
            <div className="relative max-w-2xl mx-auto mb-8">

              <form onSubmit={handleSearch} className="relative">

                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('homepage.hero.searchPlaceholder')}
                  className="w-full px-6 py-4 rounded-full text-black bg-white/90 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  onFocus={() =>
                    searchQuery.trim().length >= 2 &&
                    setShowSearchResults(true)
                  }
                />

                <button
                  className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold"
                  type="submit"
                >
                  🔍
                </button>

              </form>

              {/* SEARCH DROPDOWN */}
              {showSearchResults && (
                <div
                  ref={searchResultsRef}
                  className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-auto"
                >

                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => navigate(`/games/${game.id}`)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-100"
                      >
                        <img
                          src={game.background_image}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="text-left">
                          <p className="font-semibold">{game.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatYear(game.released)}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 text-center">
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
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 py-3 rounded-full"
              >
                Explore Games
              </Link>

              <Link
                to="/reviews"
                className="bg-white/10 border border-white/30 px-8 py-3 rounded-full hover:bg-white/20"
              >
                Reviews
              </Link>

            </div>

          </div>
        </div>
      </section>

      {/* 🔥 TRENDING SECTION */}
      <section className="py-16 bg-slate-100">
        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-800">
              🔥 Trending Now
            </h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4">

            {trendingGames.map((game) => (
              <Link
                key={game.id}
                to={`/games/${game.id}`}
                className="flex-shrink-0 w-64 group"
              >
                <div className="bg-white rounded-xl shadow hover:shadow-lg transition">

                  <img
                    src={game.background_image}
                    className="h-40 w-full object-cover group-hover:scale-105 transition"
                  />

                  <div className="p-4">
                    <h3 className="font-semibold truncate">
                      {game.name}
                    </h3>
                    <p className="text-yellow-500 text-sm mt-1">
                      ★ {game.rating}
                    </p>
                  </div>

                </div>
              </Link>
            ))}

          </div>

        </div>
      </section>
      
      {/* ⭐ TOP RATED SECTION */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">

          <h2 className="text-3xl font-bold mb-8 text-slate-800">
            ⭐ Top Rated Games
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

            {topRatedGames.map((game) => (
              <Link key={game.id} to={`/games/${game.id}`}>
                <div className="bg-slate-50 rounded-lg overflow-hidden hover:shadow-lg transition">

                  <img
                    src={game.background_image}
                    className="h-32 w-full object-cover"
                    alt={game.name}
                  />

                  <div className="p-2">
                    <p className="font-semibold text-sm truncate">
                      {game.name}
                    </p>
                    <p className="text-yellow-500 text-xs">
                      ★ {game.rating}
                    </p>
                  </div>

                </div>
              </Link>
            ))}

          </div>

        </div>
      </section>


      {/* 🎮 GENRES SECTION */}
      <section className="py-16 bg-slate-100">
        <div className="container mx-auto px-4">

          <h2 className="text-3xl font-bold mb-8 text-slate-800">
            🎮 Explore Genres
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">

            {[
              { name: 'Action', slug: 'action' },
              { name: 'RPG', slug: 'role-playing-games-rpg' },
              { name: 'Shooter', slug: 'shooter' },
              { name: 'Adventure', slug: 'adventure' },
              { name: 'Strategy', slug: 'strategy' },
              { name: 'Indie', slug: 'indie' }
            ].map((g) => (
              <Link
                key={g.slug}
                to={`/games?genres=${g.slug}`}
                className="bg-white rounded-xl p-6 text-center hover:shadow-md transition"
              >
                <p className="font-semibold">{g.name}</p>
              </Link>
            ))}

          </div>

        </div>
      </section>


      {/* 🎯 POPULAR GAMES */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-800">
              🎯 Popular Games
            </h2>

            <Link to="/games" className="text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          <div className="relative">

            <button
              onClick={() => scroll(popularGamesRef, -1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
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
                  className="flex-shrink-0 w-60 group"
                >
                  <div className="bg-white rounded-xl shadow hover:shadow-xl transition">

                    <img
                      src={game.background_image}
                      className="h-44 w-full object-cover group-hover:scale-105 transition"
                    />

                    <div className="p-3">
                      <h3 className="font-semibold truncate">
                        {game.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        ★ {game.rating}
                      </p>
                    </div>

                  </div>
                </Link>
              ))}

            </div>

            <button
              onClick={() => scroll(popularGamesRef, 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ▶
            </button>

          </div>

        </div>
      </section>
      
      {/* 🆕 RECENT RELEASES */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-800">
              🆕 Recent Releases
            </h2>

            <Link
              to="/games?ordering=-released"
              className="text-blue-600 hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="relative">

            <button
              onClick={() => scroll(recentGamesRef, -1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ◀
            </button>

            <div
              ref={recentGamesRef}
              className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
            >

              {recentGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="flex-shrink-0 w-60 group"
                >
                  <div className="bg-white rounded-xl shadow hover:shadow-lg transition">

                    <img
                      src={game.background_image}
                      className="h-44 w-full object-cover group-hover:scale-105 transition"
                      alt={game.name}
                    />

                    <div className="p-3">
                      <h3 className="font-semibold truncate">
                        {game.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        ★ {game.rating}
                      </p>
                    </div>

                  </div>
                </Link>
              ))}

            </div>

            <button
              onClick={() => scroll(recentGamesRef, 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ▶
            </button>

          </div>

        </div>
      </section>


      {/* 📰 NEWS SECTION (KEPT BUT CLEANED) */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">

          <h2 className="text-3xl font-bold mb-8 text-slate-800">
            📰 Gaming News
          </h2>

          <div className="text-center text-gray-500 py-10">
            <p className="text-lg">
              News feed will be added soon.
            </p>
            <p className="text-sm mt-2">
              (This section is reserved for live updates)
            </p>
          </div>

        </div>
      </section>


      {/* FOOTER SPACER */}
      <div className="py-10"></div>

    </div>
  )
}

export default HomePage