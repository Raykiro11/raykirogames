import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Header() {
  const { t, i18n } = useTranslation('common')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    console.log('Searching for:', searchTerm)
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  const getCurrentLanguageLabel = () => {
    switch (i18n.language) {
      case 'pt':
        return 'PT-BR'
      case 'es':
        return 'ES'
      default:
        return 'EN-US'
    }
  }

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🎮</span>
            </div>
            <span className="text-xl font-bold text-gray-800">{t('app.name')}</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-800 font-medium">
              {t('navigation.home')}
            </Link>
            <Link to="/games" className="text-gray-600 hover:text-gray-800 font-medium">
              {t('navigation.games')}
            </Link>
            <Link to="/reviews" className="text-gray-600 hover:text-gray-800 font-medium">
              {t('navigation.reviews')}
            </Link>
            <Link to="/popular" className="text-gray-600 hover:text-gray-800 font-medium">
              {t('navigation.popular')}
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={t('navigation.search')}
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                🔍
              </button>
            </form>
          </div>

          {/* Right side - Language & Auth */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="en">🇺🇸 EN-US</option>
                <option value="pt">🇧🇷 PT-BR</option>
                <option value="es">🇪🇸 ES</option>
              </select>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                {t('navigation.login')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 font-medium transition-all duration-200"
              >
                {t('navigation.signup')}
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder={t('navigation.search')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              🔍
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}

export default Header