import React, { useEffect, useState, useRef, useCallback } from "react"
import { Link } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function GamesPage() {
  const [games, setGames] = useState([])

  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const [search, setSearch] = useState("")
  const [ordering, setOrdering] = useState("-added")

  // NEW FILTERS (safe RAWG format)
  const [genre, setGenre] = useState("")
  const [platform, setPlatform] = useState("")

  const observerRef = useRef(null)

  // =========================
  // FETCH GAMES
  // =========================
  const fetchGames = async (pageNumber, reset = false) => {
    if (loading) return

    setLoading(true)

    try {
      let url = `${API_BASE_URL}/games?page=${pageNumber}&page_size=20`

      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }

      if (ordering) {
        url += `&ordering=${ordering}`
      }

      // IMPORTANT: RAWG expects readable names
      if (genre) {
        url += `&genres=${encodeURIComponent(genre)}`
      }

      if (platform) {
        url += `&platforms=${encodeURIComponent(platform)}`
      }

      const res = await fetch(url)
      const data = await res.json()

      if (data.status === "success") {
        if (reset) {
          setGames(data.games)
        } else {
          setGames((prev) => [...prev, ...data.games])
        }

        if (!data.games || data.games.length < 20) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error("Error loading games:", err)
      setHasMore(false)
    }

    setLoading(false)
  }

  // =========================
  // RESET ON FILTER CHANGE
  // =========================
  useEffect(() => {
    setGames([])
    setPage(1)
    setHasMore(true)
    fetchGames(1, true)
  }, [search, ordering, genre, platform])

  // =========================
  // INFINITE SCROLL
  // =========================
  const lastGameRef = useCallback(
    (node) => {
      if (loading) return
      if (!hasMore) return

      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchGames(nextPage)
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [loading, hasMore, page]
  )

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <h1 className="text-3xl font-bold mb-6">Games</h1>

      {/* FILTERS */}
      <div className="flex gap-4 mb-6 flex-wrap">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-64"
        />

        {/* SORT */}
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

        {/* GENRE (SAFE RAWG VALUES) */}
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Genres</option>
          <option value="Action">Action</option>
          <option value="Adventure">Adventure</option>
          <option value="RPG">RPG</option>
          <option value="Shooter">Shooter</option>
          <option value="Strategy">Strategy</option>
        </select>

        {/* PLATFORM (SAFE RAWG VALUES) */}
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Platforms</option>
          <option value="PC">PC</option>
          <option value="PlayStation 5">PlayStation 5</option>
          <option value="PlayStation 4">PlayStation 4</option>
          <option value="Xbox One">Xbox One</option>
          <option value="Xbox Series S/X">Xbox Series S/X</option>
          <option value="Nintendo Switch">Nintendo Switch</option>
        </select>

      </div>

      {/* GAMES GRID */}
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
      {!hasMore && games.length > 0 && (
        <p className="text-center mt-6 text-gray-500">
          No more games
        </p>
      )}

      {/* EMPTY STATE FIX */}
      {!loading && games.length === 0 && (
        <p className="text-center mt-6 text-gray-500">
          No games found for this filter
        </p>
      )}

    </div>
  )
}

export default GamesPage