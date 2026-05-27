import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function GamesPage() {
  const [games, setGames] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const fetchGames = async (pageNumber) => {
    if (loading || !hasMore) return

    setLoading(true)

    try {
      const res = await fetch(
        `${API_BASE_URL}/games?page=${pageNumber}&page_size=20`
      )

      const data = await res.json()

      if (data.status === "success") {
        setGames((prev) => [...prev, ...data.games])

        if (data.games.length < 20) {
          setHasMore(false)
        }
      }
    } catch (err) {
      console.error("Error loading games:", err)
    }

    setLoading(false)
  }

  // initial load
  useEffect(() => {
    fetchGames(1)
  }, [])

  // infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      if (scrollTop + windowHeight >= docHeight - 200) {
        const nextPage = page + 1
        setPage(nextPage)
        fetchGames(nextPage)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [page, hasMore, loading])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Games</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {games.map((game) => (
          <Link key={game.id} to={`/games/${game.id}`}>
            <div className="bg-white rounded shadow p-2">
              <img
                src={game.background_image}
                alt={game.name}
                className="w-full h-40 object-cover rounded"
              />
              <h3 className="mt-2 font-semibold">{game.name}</h3>
            </div>
          </Link>
        ))}
      </div>

      {loading && (
        <p className="text-center mt-6">Loading more games...</p>
      )}

      {!hasMore && (
        <p className="text-center mt-6 text-gray-500">
          No more games
        </p>
      )}
    </div>
  )
}

export default GamesPage