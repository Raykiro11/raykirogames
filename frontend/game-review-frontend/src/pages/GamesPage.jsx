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

  // NEW FILTERS
  const [genres, setGenres] = useState([])
  const [platforms, setPlatforms] = useState([])

  const [selectedGenre, setSelectedGenre] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState("")

  const [sidebarOpen, setSidebarOpen] = useState(true)

  const observerRef = useRef(null)

  // =========================
  // DEBOUNCE SEARCH
  // =========================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // =========================
  // LOAD FILTER OPTIONS
  // =========================
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [gRes, pRes] = await Promise.all([
          fetch(`${API_BASE_URL}/games/genres`),
          fetch(`${API_BASE_URL}/games/platforms`)
        ])

        const gData = await gRes.json()
        const pData = await pRes.json()

        if (gData.status === "success") setGenres(gData.genres)
        if (pData.status === "success") setPlatforms(pData.platforms)

      } catch (err) {
        console.error("Error loading filters:", err)
      }
    }

    loadFilters()
  }, [])

  // =========================
  // FETCH GAMES
  // =========================
  const fetchGames = async (pageNumber, reset = false) => {
    if (loading) return

    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: pageNumber,
        page_size: 20,
        search: debouncedSearch,
        ordering,
      })

      if (selectedGenre) params.append("genres", selectedGenre)
      if (selectedPlatform) params.append("platforms", selectedPlatform)

      const res = await fetch(`${API_BASE_URL}/games?${params}`)
      const data = await res.json()

      if (data.status === "success") {
        setGames((prev) => {
          const combined = reset ? data.games : [...prev, ...data.games]

          const unique = Array.from(
            new Map(combined.map(g => [g.id, g])).values()
          )

          return unique
        })

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
  // RESET ON FILTER CHANGE
  // =========================
  useEffect(() => {
    setGames([])
    setPage(1)
    setHasMore(true)

    window.scrollTo({ top: 0, behavior: "smooth" })

    fetchGames(1, true)
  }, [debouncedSearch, ordering, selectedGenre, selectedPlatform])

  // =========================
  // NEXT PAGE
  // =========================
  useEffect(() => {
    if (page === 1) return
    fetchGames(page, false)
  }, [page])

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
    <div className="min-h-screen bg-gray-50 flex">

      {/* =========================
          SIDEBAR FILTERS
      ========================= */}
      <aside className={`bg-white p-4 border-r w-72 ${sidebarOpen ? "" : "hidden md:block"}`}>

        <h2 className="text-xl font-bold mb-4">Filters</h2>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        />

        {/* ORDERING */}
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        >
          <option value="-added">Most Popular</option>
          <option value="-released">Newest</option>
          <option value="name">Name A-Z</option>
          <option value="-rating">Top Rated</option>
        </select>

        {/* GENRES */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Genres</h3>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* PLATFORMS */}
        <div>
          <h3 className="font-semibold mb-2">Platforms</h3>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}
      <main className="flex-1 p-6">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Games</h1>

          <button
            className="md:hidden px-3 py-2 bg-gray-200 rounded"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            Filters
          </button>
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
                className="bg-white rounded shadow overflow-hidden hover:scale-105 transition"
              >
                <img
                  src={game.background_image}
                  alt={game.name}
                  className="w-full h-40 object-cover"
                />

                <div className="p-2">
                  <h3 className="font-semibold truncate">{game.name}</h3>
                  <p className="text-sm text-gray-500">
                    ⭐ {game.rating || "N/A"}
                  </p>
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

      </main>

    </div>
  )
}

export default GamesPage