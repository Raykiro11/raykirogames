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
  const [consoleNews, setConsoleNews] = useState([])

  const [trendingGames, setTrendingGames] = useState([])
  const [topRatedGames, setTopRatedGames] = useState([])

  const [loadingGames, setLoadingGames] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const searchRef = useRef(null)
  const searchResultsRef = useRef(null)

  const popularRef = useRef(null)
  const recentRef = useRef(null)
  const trendingRef = useRef(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingGames(true)

        const [popularData, recentData, consoleNewsData] =
          await Promise.all([
            fetchPopularGames(1, 30),
            fetchRecentGames(1, 30),
            fetchConsoleNews()
          ])

        const safePopular = (popularData.games || []).filter(g => g?.id)
        const safeRecent = (recentData.games || []).filter(g => g?.id)

        setPopularGames(safePopular)

        // 🆕 FIXED TRENDING LOGIC
        const trending = [...safePopular]
          .filter(g => g.rating)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10)

        setTrendingGames(trending)

        // ⭐ FIXED TOP RATED
        const topRated = [...safePopular]
          .filter(g => g.rating)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10)

        setTopRatedGames(topRated)

        // 🆕 FIXED RECENT
        const recent = [...safeRecent]
          .sort(
            (a, b) =>
              new Date(b.released || 0) - new Date(a.released || 0)
          )
          .slice(0, 10)

        setRecentGames(recent)

        if (consoleNewsData.status === 'ok') {
          setConsoleNews(consoleNewsData.articles || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingGames(false)
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
          setSearchResults(data.games || [])
          setShowSearchResults(true)
        }
      } catch (err) {
        console.error(err)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }

    const timeout = setTimeout(searchGames, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const scroll = (ref, dir) => {
    if (!ref.current) return
    ref.current.scrollBy({
      left: dir * 300,
      behavior: 'smooth'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* 🔵 HERO */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-20 text-center max-w-4xl">

          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
            {t('homepage.hero.title')}
          </h1>

          <p className="text-lg md:text-2xl text-slate-200 mb-10">
            {t('homepage.hero.subtitle')}
          </p>

          {/* SEARCH */}
          <div className="relative max-w-2xl mx-auto mb-8">

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  navigate(
                    `/games?search=${encodeURIComponent(searchQuery)}`
                  )
                }
              }}
            >
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('homepage.hero.searchPlaceholder')}
                className="w-full px-6 py-4 rounded-full text-black bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onFocus={() =>
                  searchQuery.length >= 2 && setShowSearchResults(true)
                }
              />

              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-full"
              >
                🔍
              </button>
            </form>

            {/* DROPDOWN */}
            {showSearchResults && (
              <div
                ref={searchResultsRef}
                className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-auto"
              >
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((game) => (
                    <button
                      key={game.id}
                      onClick={() =>
                        navigate(`/games/${game.id}`)
                      }
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-100"
                    >
                      <img
                        src={game.background_image}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="text-left">
                        <p className="font-semibold">
                          {game.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {game.released || 'TBA'}
                        </p>
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
          <div className="flex gap-4 justify-center flex-wrap">

            <Link
              to="/games"
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 py-3 rounded-full"
            >
              Explore Games
            </Link>

            <Link
              to="/reviews"
              className="bg-white/10 border border-white/20 px-8 py-3 rounded-full"
            >
              Reviews
            </Link>

          </div>
        </div>
      </section>

      {/* 🔥 TRENDING (FIXED — NO DUPLICATE BARS ISSUE) */}
      <section className="py-14">
        <div className="container mx-auto px-4">

          <h2 className="text-3xl font-bold mb-6 text-slate-800">
            🔥 Trending Now
          </h2>

          <div className="relative">

            <button
              onClick={() => scroll(trendingRef, -1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ◀
            </button>

            <div
              ref={trendingRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
            >
              {trendingGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="flex-shrink-0 w-64"
                >
                  <div className="bg-white rounded-xl shadow hover:shadow-lg transition">

                    <img
                      src={game.background_image}
                      className="h-40 w-full object-cover"
                    />

                    <div className="p-3">
                      <p className="font-semibold truncate">
                        {game.name}
                      </p>
                      <p className="text-yellow-500 text-sm">
                        ★ {game.rating}
                      </p>
                    </div>

                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={() => scroll(trendingRef, 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ▶
            </button>

          </div>
        </div>
      </section>
      
      {/* ⭐ TOP RATED */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">

          <h2 className="text-3xl font-bold mb-6 text-slate-800">
            ⭐ Top Rated
          </h2>

          <div className="relative">

            <button
              onClick={() => scroll(popularRef, -1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ◀
            </button>

            <div
              ref={popularRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
            >
              {topRatedGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="flex-shrink-0 w-60"
                >
                  <div className="bg-white rounded-xl shadow hover:shadow-lg transition">

                    <img
                      src={game.background_image}
                      className="h-40 w-full object-cover"
                      alt={game.name}
                    />

                    <div className="p-3">
                      <p className="font-semibold truncate">
                        {game.name}
                      </p>

                      <p className="text-yellow-500 text-sm">
                        ★ {game.rating}
                      </p>
                    </div>

                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={() => scroll(popularRef, 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ▶
            </button>

          </div>
        </div>
      </section>

      {/* 🎯 POPULAR GAMES */}
      <section className="py-14 bg-slate-50">
        <div className="container mx-auto px-4">

          <h2 className="text-3xl font-bold mb-6 text-slate-800">
            🎯 Popular Games
          </h2>

          <div className="relative">

            <button
              onClick={() => scroll(popularRef, -1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ◀
            </button>

            <div
              ref={popularRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
            >
              {popularGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="flex-shrink-0 w-60"
                >
                  <div className="bg-white rounded-xl shadow hover:shadow-lg transition">

                    <img
                      src={game.background_image}
                      className="h-40 w-full object-cover"
                      alt={game.name}
                    />

                    <div className="p-3">
                      <p className="font-semibold truncate">
                        {game.name}
                      </p>

                      <p className="text-gray-500 text-sm">
                        ★ {game.rating}
                      </p>
                    </div>

                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={() => scroll(popularRef, 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ▶
            </button>

          </div>
        </div>
      </section>
      
      {/* 🆕 RECENT RELEASES */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">

          <h2 className="text-3xl font-bold mb-6 text-slate-800">
            🆕 Recent Releases
          </h2>

          <div className="relative">

            <button
              onClick={() => scroll(recentRef, -1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ◀
            </button>

            <div
              ref={recentRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
            >
              {recentGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="flex-shrink-0 w-60"
                >
                  <div className="bg-white rounded-xl shadow hover:shadow-lg transition">

                    <img
                      src={game.background_image}
                      className="h-40 w-full object-cover"
                      alt={game.name}
                    />

                    <div className="p-3">
                      <p className="font-semibold truncate">
                        {game.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {game.released || "TBA"}
                      </p>
                    </div>

                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={() => scroll(recentRef, 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
            >
              ▶
            </button>

          </div>
        </div>
      </section>

      {/* 🧼 CLEAN FOOTER SPACER */}
      <div className="py-12" />

    </div>
  )
}

export default HomePage