import React, { useEffect, useState, useRef, useCallback } from "react"
import { Link } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function GamesPage() {
  const [games, setGames] = useState([])

  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [ordering, setOrdering] = useState("-added")

  const observerRef = useRef(null)

  // =========================
  // DEBOUNCE SEARCH (NEW)
  // =========================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // =========================
  // FETCH GAMES
  // =========================
  const fetchGames = async (pageNumber, reset = false) => {
    if (loading) return

    setLoading(true)

    try {
      const res = await fetch(
        `${API_BASE_URL}/games?page=${pageNumber}&page_size=20&search=${encodeURIComponent(
          debouncedSearch
        )}&ordering=${ordering}`
      )

      const data = await res.json()

      if (data.status === "success") {
        setGames((prev) => {
          const combined = reset ? data.games : [...prev, ...data.games]

          // remove duplicates
          const unique = Array.from(
            new Map(combined.map(g => [g.id, g])).values()
          )

          return unique
        })

        // if less than page size → no more data
        if (data.games.length < 20) {
          setHasMore(false)
        }
      }
    } catch (err) {
      console.error("Error loading games:", err)
    }

    setLoading(false)
  }

  // =========================
  // RESET WHEN FILTERS CHANGE (NEW)
  // =========================
  useEffect(() => {
    setGames([])
    setPage(1)
    setHasMore(true)

    window.scrollTo({ top: 0, behavior: "smooth" })

    fetchGames(1, true)
  }, [debouncedSearch, ordering])

  // =========================
  // LOAD NEXT PAGE
  // =========================
  useEffect(() => {
    if (page === 1) return
    fetchGames(page, false)
  }, [page])

  // =========================
  // INFINITE SCROLL (STABLE VERSION)
  // =========================
  const lastGameRef = useCallback(
    (node) => {
      if (loading) return
      if (!hasMore) return

      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1)
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [loading, hasMore]
  )

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <h1 className="text-3xl font-bold mb-6">Games</h1>

      {/* FILTERS */}
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

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {games.map((game, index) => {
          const isLast = index === games.length - 1

          return (
            <Link
              key={game.id}
              to={`/games/${game.id}`}
              ref={isLast ? lastGameRef : null}
            >
              <div className="bg-white rounded shadow overflow-hidden hover:scale-105 transition">

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
          )
        })}

      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-center mt-6">Loading more games...</p>
      )}

      {/* END */}
      {!hasMore && (
        <p className="text-center mt-6 text-gray-500">
          No more games
        </p>
      )}

    </div>
  )
}

export default GamesPage