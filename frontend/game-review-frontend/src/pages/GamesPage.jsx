import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function GamesPage() {
  const [games, setGames] = useState([])

  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const [search, setSearch] = useState("")
  const [ordering, setOrdering] = useState("-added")

  // ========================
  // FETCH GAMES
  // ========================
  const fetchGames = async (pageNumber, reset = false) => {
    if (loading) return

    setLoading(true)

    try {
      const res = await fetch(
        `${API_BASE_URL}/games?page=${pageNumber}&page_size=20&search=${encodeURIComponent(
          search
        )}&ordering=${ordering}`
      )

      const data = await res.json()

      if (data.status === "success") {
        if (reset) {
          setGames(data.games)
        } else {
          setGames((prev) => [...prev, ...data.games])
        }

        if (data.games.length < 20) {
          setHasMore(false)
        } else {
          setHasMore(true)
        }
      }
    } catch (err) {
      console.error("Error fetching games:", err)
    }

    setLoading(false)
  }

  // ========================
  // RESET WHEN FILTERS CHANGE
  // ========================
  useEffect(() => {
    setGames([])
    setPage(1)
    setHasMore(true)
  }, [search, ordering])

  // ========================
  // LOAD PAGE
  // ========================
  useEffect(() => {
    fetchGames(page, page === 1)
  }, [page, search, ordering])

  // ========================
  // INFINITE SCROLL
  // ========================
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return

      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      if (scrollTop + windowHeight >= docHeight - 300) {
        setPage((prev) => prev + 1)
      }
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [loading, hasMore])

  // ========================
  // UI
  // ========================
  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <h1 className="text-3xl font-bold mb-6">Games</h1>

      <div className="flex gap-4 mb-6 flex-wrap">

        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-64"
        />

        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="-added">Most Popular</option>
          <option value="-released">Newest</option>
          <option value="name">Name A-Z</option>
          <option value="-rating">Top Rated</option>
        </select>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {games.map((game) => (
          <Link key={game.id} to={`/games/${game.id}`}>
            <div className="bg-white rounded shadow hover:scale-105 transition overflow-hidden">

              <img
                src={game.background_image}
                alt={game.name}
                className="w-full h-40 object-cover"
                onError={(e) =>
                  (e.target.src =
                    "data:image/svg+xml;base64,...")
                }
              />

              <div className="p-2">
                <h3 className="font-semibold truncate">
                  {game.name}
                </h3>

                <p className="text-sm text-gray-500">
                  ⭐ {game.rating || "N/A"}
                </p>
              </div>

            </div>
          </Link>
        ))}

      </div>

      {loading && (
        <p className="text-center mt-6">
          Loading more games...
        </p>
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