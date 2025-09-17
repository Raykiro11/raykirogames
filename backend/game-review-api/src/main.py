import os
import sys
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Configuração básica
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# API RAWG Configuration - Usar a chave do .env
RAWG_API_KEY = os.getenv('RAWG_API_KEY') or '2f8b3853d2fd47cabd77e4d78a6cf96f'
RAWG_BASE_URL = 'https://api.rawg.io/api'

# Inicializar extensões
cors_origins = os.getenv('CORS_ORIGINS', '').split(',')
CORS(app, origins=cors_origins)

jwt = JWTManager(app)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)
limiter.init_app(app)

# Cache simples para evitar requisições desnecessárias
cache = {}
CACHE_DURATION = 300  # 5 minutos

def get_cache_key(endpoint, params):
    """Gera uma chave única para cache baseada no endpoint e parâmetros"""
    sorted_params = sorted(params.items()) if params else []
    return f"{endpoint}_{hash(str(sorted_params))}"

def is_cache_valid(cache_entry):
    """Verifica se o cache ainda é válido"""
    return datetime.now() - cache_entry['timestamp'] < timedelta(seconds=CACHE_DURATION)

# Função para fazer requisições à API RAWG com cache
def fetch_from_rawg(endpoint, params=None):
    if params is None:
        params = {}
    params['key'] = RAWG_API_KEY
    
    # Verificar cache
    cache_key = get_cache_key(endpoint, params)
    if cache_key in cache and is_cache_valid(cache[cache_key]):
        print(f"Cache hit for {endpoint}")
        return cache[cache_key]['data']
    
    try:
        response = requests.get(f"{RAWG_BASE_URL}/{endpoint}", params=params)
        response.raise_for_status()
        data = response.json()
        
        # Armazenar no cache
        cache[cache_key] = {
            'data': data,
            'timestamp': datetime.now()
        }
        
        print(f"API call made for {endpoint}")
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching from RAWG API: {e}")
        return None

# Rota de saúde
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Game Review API is running',
        'cache_size': len(cache)
    })

# Rota para jogos populares
@app.route('/api/games/popular')
def get_popular_games():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 12, type=int)

    data = fetch_from_rawg('games', {
        'ordering': '-added',
        'page': page,
        'page_size': page_size
    })

    if data:
        games = []
        for game in data.get('results', []):
            games.append({
                'id': game.get('id'),
                'name': game.get('name'),
                'background_image': game.get('background_image'),
                'rating': game.get('rating'),
                'released': game.get('released'),
                'genres': [genre['name'] for genre in game.get('genres', [])],
                'platforms': [platform['platform']['name'] for platform in game.get('platforms', [])]
            })

        return jsonify({
            'status': 'success',
            'games': games,
            'page': page,
            'page_size': page_size,
            'total': data.get('count', 0),
            'next': data.get('next') is not None,
            'previous': data.get('previous') is not None
        })

    return jsonify({
        'status': 'error',
        'message': 'Failed to fetch popular games'
    }), 500

# Rota para jogos recentes (2024-2025)
@app.route('/api/games/recent')
def get_recent_games():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 12, type=int)

    # Buscar jogos lançados entre 2024 e 2025
    current_year = datetime.now().year
    start_date = f"{current_year - 1}-01-01"  # 2024-01-01
    end_date = f"{current_year}-12-31"        # 2025-12-31

    data = fetch_from_rawg('games', {
        'ordering': '-released',
        'page': page,
        'page_size': page_size,
        'dates': f'{start_date},{end_date}'  # Filtro de data para jogos recentes
    })

    if data:
        games = []
        for game in data.get('results', []):
            released_date = game.get('released')
            if released_date:
                try:
                    release_year = datetime.strptime(released_date, '%Y-%m-%d').year
                    if release_year >= 2024:
                        games.append({
                            'id': game.get('id'),
                            'name': game.get('name'),
                            'background_image': game.get('background_image'),
                            'rating': game.get('rating'),
                            'released': game.get('released'),
                            'genres': [genre['name'] for genre in game.get('genres', [])],
                            'platforms': [platform['platform']['name'] for platform in game.get('platforms', [])]
                        })
                except ValueError:
                    games.append({
                        'id': game.get('id'),
                        'name': game.get('name'),
                        'background_image': game.get('background_image'),
                        'rating': game.get('rating'),
                        'released': game.get('released'),
                        'genres': [genre['name'] for genre in game.get('genres', [])],
                        'platforms': [platform['platform']['name'] for platform in game.get('platforms', [])]
                    })

        return jsonify({
            'status': 'success',
            'games': games,
            'page': page,
            'page_size': page_size,
            'total': data.get('count', 0),
            'next': data.get('next') is not None,
            'previous': data.get('previous') is not None
        })

    return jsonify({
        'status': 'error',
        'message': 'Failed to fetch recent games'
    }), 500

# Rota principal para jogos com filtros e paginação otimizada
@app.route('/api/games')
def get_games():
    search = request.args.get('search', '').strip()
    genres = request.args.get('genres', '').strip()
    platforms = request.args.get('platforms', '').strip()
    ordering = request.args.get('ordering', '-added')
    page = request.args.get('page', 1, type=int)
    page_size = min(request.args.get('page_size', 20, type=int), 40)

    if page < 1:
        page = 1

    params = {
        'ordering': ordering,
        'page': page,
        'page_size': page_size
    }

    if search:
        params['search'] = search
    if genres:
        params['genres'] = genres
    if platforms:
        params['platforms'] = platforms

    data = fetch_from_rawg('games', params)

    if data:
        games = []
        seen_ids = set()
        for game in data.get('results', []):
            game_id = game.get('id')
            if game_id and game_id not in seen_ids:
                seen_ids.add(game_id)
                games.append({
                    'id': game_id,
                    'name': game.get('name'),
                    'background_image': game.get('background_image'),
                    'rating': game.get('rating', 0),
                    'released': game.get('released'),
                    'genres': [genre['name'] for genre in game.get('genres', [])],
                    'platforms': [platform['platform']['name'] for platform in game.get('platforms', [])],
                    'metacritic': game.get('metacritic'),
                    'playtime': game.get('playtime', 0)
                })

        total_count = data.get('count', 0)
        has_next = data.get('next') is not None
        has_previous = data.get('previous') is not None
        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1

        return jsonify({
            'status': 'success',
            'games': games,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_previous': has_previous,
                'next_page': page + 1 if has_next else None,
                'previous_page': page - 1 if has_previous else None
            },
            'page': page,
            'page_size': page_size,
            'total': total_count
        })

    return jsonify({
        'status': 'error',
        'message': 'Failed to fetch games'
    }), 500

# Rota para jogos com base na pontuação do Metacritic (para a página de reviews de críticos)
@app.route('/api/games/critic-reviews')
def get_critic_reviews():
    data = fetch_from_rawg('games', {
        'ordering': '-metacritic',
        'page_size': 20,
        'metacritic': '70,100'
    })
    
    if data:
        games = []
        for game in data.get('results', []):
            if game.get('metacritic'):
                games.append({
                    'id': game.get('id'),
                    'name': game.get('name'),
                    'background_image': game.get('background_image'),
                    'metacritic': game.get('metacritic'),
                    'released': game.get('released'),
                    'genres': [genre['name'] for genre in game.get('genres', [])]
                })
        
        return jsonify({
            'status': 'success',
            'games': games
        })
    
    return jsonify({
        'status': 'error',
        'message': 'Failed to fetch critic reviews'
    }), 500

# Rota para gêneros
@app.route('/api/games/genres')
def get_genres():
    data = fetch_from_rawg('genres', {'page_size': 50})
    
    if data:
        genres = [genre['name'] for genre in data.get('results', [])]
        return jsonify({
            'status': 'success',
            'genres': genres
        })
    
    return jsonify({
        'status': 'error',
        'message': 'Failed to fetch genres'
    }), 500

# Rota para plataformas
@app.route('/api/games/platforms')
def get_platforms():
    data = fetch_from_rawg('platforms', {'page_size': 50})
    
    if data:
        platforms = [platform['name'] for platform in data.get('results', [])]
        return jsonify({
            'status': 'success',
            'platforms': platforms
        })
    
    return jsonify({
        'status': 'error',
        'message': 'Failed to fetch platforms'
    }), 500

# Rota para detalhes de um jogo específico
@app.route('/api/games/<int:game_id>')
def get_game_details(game_id):
    game_data = fetch_from_rawg(f'games/{game_id}')
    
    if game_data:
        screenshots_data = fetch_from_rawg(f'games/{game_id}/screenshots')
        
        game = {
            'id': game_data.get('id'),
            'name': game_data.get('name'),
            'description': game_data.get('description_raw', ''),
            'background_image': game_data.get('background_image'),
            'rating': game_data.get('rating'),
            'metacritic': game_data.get('metacritic'),
            'released': game_data.get('released'),
            'genres': [genre['name'] for genre in game_data.get('genres', [])],
            'platforms': [platform['platform']['name'] for platform in game_data.get('platforms', [])],
            'developers': [dev['name'] for dev in game_data.get('developers', [])],
            'publishers': [pub['name'] for pub in game_data.get('publishers', [])],
            'esrb_rating': game_data.get('esrb_rating', {}).get('name', 'Not Rated') if game_data.get('esrb_rating') else 'Not Rated',
            'playtime': game_data.get('playtime'),
            'screenshots': [
                screenshot.get('image') for screenshot in screenshots_data.get('results', [])[:6]
            ] if screenshots_data else []
        }
        
        return jsonify({
            'status': 'success',
            'game': game
        })
    
    return jsonify({
        'status': 'error',
        'message': 'Game not found'
    }), 404

# Nova rota para detalhes de reviews de um jogo específico
@app.route('/api/games/<int:game_id>/reviews')
def get_game_reviews(game_id):
    game_data = fetch_from_rawg(f'games/{game_id}')
    
    if not game_data:
        return jsonify({
            'status': 'error',
            'message': 'Game not found'
        }), 404
    
    metacritic_score = game_data.get('metacritic', 75)
    
    quality_words = ["excepcional", "sólida", "decente"]
    impact_words = ["define novos padrões", "atende às expectativas", "tem seus méritos"]
    quality_index = min(2, max(0, (100-metacritic_score)//20))
    impact_index = min(2, max(0, (100-metacritic_score)//20))
    
    critic_reviews = [
        {
            'source': 'Metacritic',
            'score': metacritic_score,
            'maxScore': 100,
            'review': f'Uma experiência {quality_words[quality_index]} que {impact_words[impact_index]} no gênero.',
            'pros': ['Gráficos impressionantes', 'Jogabilidade fluida', 'História envolvente'],
            'cons': ['Alguns bugs menores', 'Curva de aprendizado íngreme'] if metacritic_score < 85 else ['Poderia ser mais longo'],
            'date': '2024-06-15'
        },
        {
            'source': 'IGN',
            'score': max(6.0, min(10.0, metacritic_score / 10.0)),
            'maxScore': 10,
            'review': f'{"Um jogo que impressiona" if metacritic_score >= 80 else "Uma experiência mista"} com elementos que {"brilham intensamente" if metacritic_score >= 80 else "funcionam bem na maior parte do tempo"}.',
            'pros': ['Design de personagens', 'Trilha sonora', 'Mecânicas inovadoras'],
            'cons': ['Alguns problemas técnicos', 'Pacing irregular'] if metacritic_score < 80 else ['Falta de conteúdo pós-jogo'],
            'date': '2024-06-14'
        }
    ]
    
    user_reviews = [
        {
            'id': 1,
            'username': 'GamerPro2024',
            'rating': min(5, max(1, int(metacritic_score / 20))),
            'review': 'Jogo incrível! Recomendo para todos os fãs do gênero.',
            'date': '2024-06-20',
            'helpful': 15
        }
    ]
    
    return jsonify({
        'status': 'success',
        'game': {
            'id': game_data.get('id'),
            'name': game_data.get('name'),
            'background_image': game_data.get('background_image'),
            'metacritic': metacritic_score,
            'released': game_data.get('released'),
            'genres': [genre['name'] for genre in game_data.get('genres', [])],
            'platforms': [platform['platform']['name'] for platform in game_data.get('platforms', [])],
            'description': game_data.get('description_raw', '')[:500] + '...' if game_data.get('description_raw') else 'Descrição não disponível.'
        },
        'criticReviews': critic_reviews,
        'userReviews': user_reviews,
        'userRating': {
            'average': round(sum([r['rating'] for r in user_reviews]) / len(user_reviews), 1) if user_reviews else 0,
            'total': len(user_reviews)
        }
    })

# Nova rota para adicionar review de usuário
@app.route('/api/games/<int:game_id>/reviews', methods=['POST'])
def add_user_review(game_id):
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'rating', 'review']):
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields: username, rating, review'
        }), 400
    
    if not (1 <= data['rating'] <= 5):
        return jsonify({
            'status': 'error',
            'message': 'Rating must be between 1 and 5'
        }), 400
    
    new_review = {
        'id': len([]) + 1,
        'username': data['username'],
        'rating': data['rating'],
        'review': data['review'],
        'date': '2024-06-25',
        'helpful': 0
    }
    
    return jsonify({
        'status': 'success',
        'message': 'Review added successfully',
        'review': new_review
    })

# Rota para notícias de jogos (atualizadas com datas mais recentes)
@app.route('/api/news')
def get_gaming_news():
    gaming_news = [
        {
            'title': 'Novo RPG de mundo aberto promete revolucionar o gênero',
            'description': 'Desenvolvedores anunciam detalhes de um RPG épico com gráficos de última geração e narrativa imersiva.',
            'url': '#',
            'urlToImage': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop',
            'publishedAt': '2024-12-20T10:00:00Z',
            'source': {'name': 'GameBlast'}
        },
        {
            'title': 'Indie Game ganha prêmio de Jogo do Ano em festival',
            'description': 'Pequeno estúdio surpreende crítica e público com um jogo inovador e emocionante.',
            'url': '#',
            'urlToImage': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop',
            'publishedAt': '2024-12-18T12:45:00Z',
            'source': {'name': 'IndieGame News'}
        },
        {
            'title': 'Atualização massiva de MMORPG traz novo continente',
            'description': 'Expansão gratuita adiciona centenas de horas de conteúdo e novas classes de personagem.',
            'url': '#',
            'urlToImage': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
            'publishedAt': '2024-12-15T14:30:00Z',
            'source': {'name': 'MMORPG Central'}
        }
    ]
    
    return jsonify({
        'status': 'success',
        'news': gaming_news
    })

# Rota para notícias de consoles (atualizadas)
@app.route('/api/news/consoles')
def get_console_news():
    console_news = [
        {
            'title': 'Nintendo Switch 2: Vazamento revela especificações e data de lançamento',
            'description': 'Documentos internos da Nintendo detalham o sucessor do Switch, com hardware mais potente e novos recursos.',
            'url': '#',
            'urlToImage': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
            'publishedAt': '2024-12-21T09:00:00Z',
            'source': {'name': 'Nintendo Insider'}
        },
        {
            'title': 'PlayStation 6: Sony confirma desenvolvimento para 2027',
            'description': 'Executivos da Sony confirmam que o sucessor do PS5 está em desenvolvimento ativo.',
            'url': '#',
            'urlToImage': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop',
            'publishedAt': '2024-12-19T16:20:00Z',
            'source': {'name': 'PlayStation News'}
        }
    ]
    return jsonify({'status': 'ok', 'articles': console_news})

# Rota para limpar cache (útil para desenvolvimento)
@app.route('/api/cache/clear')
def clear_cache():
    global cache
    cache_size = len(cache)
    cache.clear()
    return jsonify({
        'status': 'success',
        'message': f'Cache cleared. Removed {cache_size} entries.'
    })

# Rotas de autenticação
@app.route('/api/auth/register', methods=['POST'])
def register():
    return jsonify({
        'message': 'Registration endpoint',
        'status': 'success'
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    return jsonify({
        'message': 'Login endpoint',
        'status': 'success'
    })

if __name__ == '__main__':
    print("🚀 Starting Game Review API...")
    print(f"📡 RAWG API Key: {RAWG_API_KEY[:10]}..." if RAWG_API_KEY else "❌ No RAWG API Key found")
    print("🌐 Server will be available at: https://www.raykirogames.com")
    
    port = int(os.environ.get('PORT', 80))
    app.run(host='0.0.0.0', port=port, debug=False)
