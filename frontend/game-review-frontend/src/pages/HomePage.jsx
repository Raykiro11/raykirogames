import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { fetchPopularGames, fetchRecentGames, fetchNews, fetchConsoleNews } from '../lib/api'
import { format } from 'date-fns'
import { pt, enUS, es } from 'date-fns/locale'

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
        const [popularData, recentData, newsData, consoleNewsData] = await Promise.all([
          fetchPopularGames(1, 20),
          fetchRecentGames(1, 20),
          fetchNews(),
          fetchConsoleNews()
        ])
        if (popularData.status === 'success') setPopularGames(popularData.games)
        if (recentData.status === 'success') setRecentGames(recentData.games)
        if (newsData.status === 'success') setGamingNews(newsData.news || [])
        if (consoleNewsData.status === 'ok') setConsoleNews(consoleNewsData.articles || [])
      } catch (error) {
        console.error('Error loading data:', error)
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
        const response = await fetch(`http://localhost:5002/api/games?search=${encodeURIComponent(searchQuery.trim())}&page_size=8`)
        const data = await response.json()
        if (data.status === 'success') {
          setSearchResults(data.games)
          setShowSearchResults(true)
        }
      } catch (error) {
        console.error('Error searching games:', error)
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchInputChange = (e) => setSearchQuery(e.target.value)
  const handleSearchResultClick = (gameId) => {
    setShowSearchResults(false)
    setSearchQuery('')
    navigate(`/games/${gameId}`)
  }
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearchResults(false)
      navigate(`/games?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    const locale = i18n.language === 'pt' ? pt : i18n.language === 'es' ? es : enUS
    if (diffInHours < 1) return t('homepage.news.justNow')
    if (diffInHours < 24) return `${diffInHours}h ${t('homepage.news.ago')}`
    if (diffInHours < 48) return t('homepage.news.yesterday')
    return format(date, 'dd MMM', { locale })
  }

  const scrollLeft = (ref) => { if(ref.current) ref.current.scrollBy({ left: -300, behavior: 'smooth' }) }
  const scrollRight = (ref) => { if(ref.current) ref.current.scrollBy({ left: 300, behavior: 'smooth' }) }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {t('homepage.hero.title')} {t('homepage.hero.titleHighlight')}
            </h1>
            <p className="text-x1 md:text-2xl mb-8 text-gray-300">{t('homepage.hero.subtitle')}</p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={t('homepage.hero.searchPlaceholder')}
                  className="w-full px-6 py-4 text-lg rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full transition-colors duration-200"
                >
                  🔍 {t('homepage.hero.searchButton')}
                </button>
              </form>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div 
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
                >
                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      Procurando jogos...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => handleSearchResultClick(game.id)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-150"
                        >
                          <img
                            src={game.background_image || 'data:image/svg+xml;base64,...'}
                            alt={game.name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => { e.target.src = 'data:image/svg+xml;base64,...' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 font-medium truncate">{game.name}</div>
                            <div className="text-gray-500 text-sm truncate">{game.genres.slice(0,2).join(', ')} • {game.released ? new Date(game.released).getFullYear() : 'TBA'}</div>
                          </div>
                          <div className="flex items-center text-yellow-500">
                            <span className="text-sm">★ {game.rating || 'N/A'}</span>
                          </div>
                        </button>
                      ))}
                      {searchResults.length >= 8 && (
                        <div className="px-4 py-2 border-t border-gray-100">
                          <button
                            onClick={() => { setShowSearchResults(false); navigate(`/games?search=${encodeURIComponent(searchQuery.trim())}`) }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Ver todos os resultados para "{searchQuery}"
                          </button>
                        </div>
                      )}
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-4xl mb-2">🎮</div>
                      <div>Nenhum jogo encontrado para "{searchQuery}"</div>
                      <button
                        onClick={() => { setShowSearchResults(false); navigate(`/games?search=${encodeURIComponent(searchQuery.trim())}`) }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                      >
                        Buscar na página de jogos
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Hero buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/games"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-full transition-colors duration-200 transform hover:scale-105"
              >
                {t('homepage.hero.exploreGames')}
              </Link>
              <Link
                to="/reviews"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-bold py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-105"
              >
                {t('homepage.hero.readReviews')}
              </Link>
            </div>
          </div>
        </div>
      </section>
{/* Popular Games Section */}
<section className="py-16 bg-white">
  <div className="container mx-auto px-4">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-bold text-gray-800">{t('homepage.sections.popular')}</h2>
      <Link to="/games" className="text-blue-600 hover:text-blue-800 font-medium">
        {t('homepage.popularGames.viewAll')} →
      </Link>
    </div>
    {loadingGames ? (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">{t('homepage.popularGames.loading')}</span>
      </div>
    ) : (
      <div className="relative">
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md"
          onClick={() => scrollLeft(popularGamesRef)}
        >
          ◀
        </button>
        <div ref={popularGamesRef} className="flex space-x-6 overflow-x-auto pb-4 scroll-smooth">
          {popularGames.map(game => (
            <Link key={game.id} to={`/games/${game.id}`} className="group flex-shrink-0 w-60">
              <div className="card-shadow rounded-lg overflow-hidden bg-white hover:transform hover:scale-105 transition-all duration-300">
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={game.background_image} 
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => { e.target.src = 'data:image/svg+xml;base64,...' }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 truncate" title={game.name}>{game.name}</h3>
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-500 text-sm">{'★'.repeat(Math.round(game.rating))}{'☆'.repeat(5 - Math.round(game.rating))}</span>
                    <span className="ml-2 text-gray-600 text-sm">{game.rating}/5</span>
                  </div>
                  <p className="text-gray-600 text-sm truncate">{game.genres.join(', ')}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md"
          onClick={() => scrollRight(popularGamesRef)}
        >
          ▶
        </button>
      </div>
    )}
  </div>
</section>

{/* Recent Releases Section */}
<section className="py-16 bg-gray-50">
  <div className="container mx-auto px-4">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-bold text-gray-800">{t('homepage.recentReleases.title')}</h2>
      <Link to="/games?ordering=-released" className="text-blue-600 hover:text-blue-800 font-medium">
        {t('homepage.recentReleases.viewAll')} →
      </Link>
    </div>
    {loadingGames ? (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">{t('homepage.recentReleases.loading')}</span>
      </div>
    ) : (
      <div className="relative">
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md"
          onClick={() => scrollLeft(recentGamesRef)}
        >
          ◀
        </button>
        <div ref={recentGamesRef} className="flex space-x-6 overflow-x-auto pb-4 scroll-smooth">
          {recentGames.map(game => (
            <Link key={game.id} to={`/games/${game.id}`} className="group flex-shrink-0 w-60">
              <div className="card-shadow rounded-lg overflow-hidden bg-white hover:transform hover:scale-105 transition-all duration-300">
                <div className="h-48 bg-gray-200 overflow-hidden relative">
                  <img 
                    src={game.background_image} 
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => { e.target.src = 'data:image/svg+xml;base64,...' }}
                  />
                  {game.released && new Date(game.released).getFullYear() >= 2024 && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">NOVO</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 truncate" title={game.name}>{game.name}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-yellow-500 text-sm">{'★'.repeat(Math.round(game.rating))}{'☆'.repeat(5 - Math.round(game.rating))}</span>
                      <span className="ml-2 text-gray-600 text-sm">{game.rating}/5</span>
                    </div>
                    {game.released && <span className="text-gray-500 text-xs">{new Date(game.released).getFullYear()}</span>}
                  </div>
                  <p className="text-gray-600 text-sm truncate">{game.genres.join(', ')}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md"
          onClick={() => scrollRight(recentGamesRef)}
        >
          ▶
        </button>
      </div>
    )}
  </div>
</section>

{/* Gaming News Section */}
<section className="py-16 bg-white">
  <div className="container mx-auto px-4">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-bold text-gray-800">{t('homepage.news.title')}</h2>
    </div>
    {loadingNews ? (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">{t('homepage.news.loading')}</span>
      </div>
    ) : (
      <div className="relative">
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md"
          onClick={() => scrollLeft(newsRef)}
        >
          ◀
        </button>
        <div ref={newsRef} className="flex space-x-6 overflow-x-auto pb-4 scroll-smooth">
          {[...gamingNews, ...consoleNews].slice(0, 20).map((article, index) => (
            <article key={index} className="flex-shrink-0 w-80 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img 
                  src={article.urlToImage} 
                  alt={article.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = 'data:image/svg+xml;base64,...' }}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-600 text-sm font-medium">{article.source.name}</span>
                  <span className="text-gray-500 text-sm">{formatTimeAgo(article.publishedAt)}</span>
                </div>
                <h3 className="font-bold text-lg mb-3 text-gray-800 line-clamp-2">{article.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.description}</p>
                <button
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(article.title)}`, '_blank')}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
                >
                  {t('homepage.news.readMore')} →
                </button>
              </div>
            </article>
          ))}
        </div>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow-md"
          onClick={() => scrollRight(newsRef)}
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
