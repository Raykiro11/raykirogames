import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

function GamesPage() {
  const { t } = useTranslation('common')

  const [games, setGames] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const observer = useRef()

  const fetchGames = async (pageNumber) => {
    if (loading) return

    setLoading(true)

    try {
      const res = await fetch(
        `${API_BASE_URL}/games?page=${pageNumber}&page_size=20`
      )
      const data = await res.json()

      if (data.status === 'success') {
        setGames((prev) => {
          const existingIds = new Set(prev.map(g => g.id))
          const newGames = data.games.filter(g => !existingIds.has(g.id))
          return [...prev, ...newGames]
        })

        // backend still sends pagination info
        if (data.games.length === 0) {
          setHasMore(false)
        }
      }
    } catch (err) {
      console.error('Error loading games:', err)
    } finally {
      setLoading(false)
    }
  }

  // initial load
  useEffect(() => {
    fetchGames(1)
  }, [])

  // load more when page changes
  useEffect(() => {
    if (page === 1) return
    fetchGames(page)
  }, [page])

  const lastGameRef = useCallback(
    (node) => {
      if (loading) return
      if (!hasMore) return

      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1)
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore]
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">{t('games.title')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {games.map((game, index) => {
          const isLast = index === games.length - 1

          return (
            <Link
              key={game.id}
              to={`/games/${game.id}`}
              ref={isLast ? lastGameRef : null}
              className="bg-white rounded-lg shadow hover:scale-105 transition overflow-hidden"
            >
              <img
                src={game.background_image}
                alt={game.name}
                className="w-full h-40 object-cover"
              />

              <div className="p-3">
                <h3 className="font-semibold truncate">{game.name}</h3>
                <p className="text-sm text-gray-500">
                  ⭐ {game.rating || 'N/A'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {loading && (
        <div className="text-center py-6 text-gray-500">
          Loading more games...
        </div>
      )}

      {!hasMore && (
        <div className="text-center py-6 text-gray-400">
          No more games
        </div>
      )}
    </div>
  )
}

export default GamesPage