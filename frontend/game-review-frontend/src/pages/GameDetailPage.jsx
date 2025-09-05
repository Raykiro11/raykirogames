import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function GameDetailPage() {
  const { t } = useTranslation('common')
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:5002/api/games/${id}` )
        const data = await response.json()
        
        if (data.status === 'success') {
          setGame(data.game)
        } else {
          setError('Game not found')
        }
      } catch (error) {
        console.error('Error fetching game details:', error)
        setError('Failed to load game details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGameDetails()
    }
  }, [id])

  const renderStars = (rating) => {
    const stars = Math.round(rating)
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-green-500'
    if (rating >= 3.5) return 'text-yellow-500'
    if (rating >= 3.0) return 'text-orange-500'
    return 'text-red-500'
  }

  const getESRBColor = (rating) => {
    switch (rating) {
      case 'Everyone': return 'bg-green-100 text-green-800'
      case 'Teen': return 'bg-yellow-100 text-yellow-800'
      case 'Mature 17+': return 'bg-red-100 text-red-800'
      case 'Adults Only 18+': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('gameDetail.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('gameDetail.notFound')}</h2>
          <p className="text-gray-600 mb-4">{error || t('gameDetail.notFoundSubtitle')}</p>
          <Link 
            to="/games" 
            className="btn-primary inline-block"
          >
            {t('gameDetail.backToGames')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-blue-600 hover:text-blue-800">{t('navigation.home')}</Link>
            <span className="text-gray-400">›</span>
            <Link to="/games" className="text-blue-600 hover:text-blue-800">{t('navigation.games')}</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-600 truncate">{game.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Game Header */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="h-96 bg-gray-200 overflow-hidden">
                {game.background_image ? (
                  <img 
                    src={game.background_image} 
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎮</div>
                      <p>No Image Available</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">{game.name}</h1>
                
                {/* Rating and Basic Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center">
                    <span className="text-yellow-500 text-xl mr-2">
                      {renderStars(game.rating)}
                    </span>
                    <span className={`text-xl font-semibold ${getRatingColor(game.rating)}`}>
                      {game.rating}/5
                    </span>
                  </div>
                  
                  {game.metacritic && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Metacritic:</span>
                      <span className={`px-2 py-1 rounded text-sm font-semibold ${
                        game.metacritic >= 75 ? 'bg-green-100 text-green-800' :
                        game.metacritic >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {game.metacritic}
                      </span>
                    </div>
                  )}
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getESRBColor(game.esrb_rating)}`}>
                    {game.esrb_rating}
                  </span>
                </div>

                {/* Genres */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('gameDetail.genres')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.genres.map((genre, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {game.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('gameDetail.description')}</h3>
                    <div className="prose max-w-none text-gray-600">
                      {game.description.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-3">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Screenshots */}
            {game.screenshots && game.screenshots.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('gameDetail.screenshots')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.screenshots.map((screenshot, index) => (
                    <div key={index} className="rounded-lg overflow-hidden">
                      <img 
                        src={screenshot} 
                        alt={`${game.name} screenshot ${index + 1}`}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Game Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('gameDetail.gameInfo')}</h3>
              
              <div className="space-y-4">
                {/* Release Date */}
                {game.released && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700">{t('gameDetail.releaseDate')}</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(game.released).toLocaleDateString()}
                    </dd>
                  </div>
                )}

                {/* Developers */}
                {game.developers && game.developers.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700">{t('gameDetail.developers')}</dt>
                    <dd className="text-sm text-gray-900">
                      {game.developers.join(', ')}
                    </dd>
                  </div>
                )}

                {/* Publishers */}
                {game.publishers && game.publishers.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700">{t('gameDetail.publishers')}</dt>
                    <dd className="text-sm text-gray-900">
                      {game.publishers.join(', ')}
                    </dd>
                  </div>
                )}

                {/* Playtime */}
                {game.playtime && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700">{t('gameDetail.playtime')}</dt>
                    <dd className="text-sm text-gray-900">
                      {game.playtime} {t('gameDetail.hours')}
                    </dd>
                  </div>
                )}
              </div>
            </div>

            {/* Platforms */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('gameDetail.platforms')}</h3>
              <div className="space-y-2">
                {game.platforms.map((platform, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm text-gray-700">{platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameDetailPage