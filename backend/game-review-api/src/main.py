import os
import sys
import requests
from datetime import datetime, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# =========================
# APP CONFIG
# =========================
app = Flask(__name__)
app.config["SECRET_KEY"] = "dev-secret-key"
app.config["JWT_SECRET_KEY"] = "jwt-secret-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

RAWG_API_KEY = os.getenv("RAWG_API_KEY")
RAWG_BASE_URL = "https://api.rawg.io/api"

if RAWG_API_KEY is None:
    print("ERRO CRÍTICO: RAWG_API_KEY não está definida!")

CORS(app, origins=["https://www.raykirogames.com"])

jwt = JWTManager(app)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)
limiter.init_app(app)

# =========================
# RAWG FILTER FIX MAPS
# =========================
GENRE_MAP = {
    "Action": "action",
    "Adventure": "adventure",
    "RPG": "role-playing-games-rpg",
    "Shooter": "shooter",
    "Strategy": "strategy",
    "Sports": "sports",
    "Racing": "racing",
    "Indie": "indie",
    "Simulation": "simulation",
}

PLATFORM_MAP = {
    "PC": 4,
    "PlayStation 5": 187,
    "PlayStation 4": 18,
    "Xbox Series X/S": 186,
    "Nintendo Switch": 7
}

# =========================
# CACHE SYSTEM
# =========================
cache = {}
CACHE_DURATION = 300

def get_cache_key(endpoint, params):
    sorted_params = sorted(params.items()) if params else []
    return f"{endpoint}_{hash(str(sorted_params))}"

def is_cache_valid(cache_entry):
    return datetime.now() - cache_entry["timestamp"] < timedelta(seconds=CACHE_DURATION)

def fetch_from_rawg(endpoint, params=None):
    if params is None:
        params = {}

    params["key"] = RAWG_API_KEY

    cache_key = get_cache_key(endpoint, params)
    if cache_key in cache and is_cache_valid(cache[cache_key]):
        return cache[cache_key]["data"]

    try:
        response = requests.get(f"{RAWG_BASE_URL}/{endpoint}", params=params)
        response.raise_for_status()
        data = response.json()

        cache[cache_key] = {
            "data": data,
            "timestamp": datetime.now()
        }

        return data

    except requests.exceptions.RequestException as e:
        print(f"RAWG error: {e}")
        return None

# =========================
# ROUTES
# =========================

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/games")
def get_games():

    search = request.args.get("search", "").strip()
    genres = request.args.get("genres", "").strip()
    platforms = request.args.get("platforms", "").strip()
    ordering = request.args.get("ordering", "-added")
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 20, type=int)

    params = {
        "ordering": ordering,
        "page": page,
        "page_size": page_size
    }

    # =========================
    # FIXED FILTER LOGIC
    # =========================
    if search:
        params["search"] = search

    if genres:
        params["genres"] = GENRE_MAP.get(genres, genres.lower())

    if platforms:
        platform_id = PLATFORM_MAP.get(platforms)
        if platform_id:
            params["platforms"] = platform_id

    data = fetch_from_rawg("games", params)

    if not data:
        return jsonify({"status": "error"}), 500

    games = []
    seen = set()

    for game in data.get("results", []):
        if game["id"] in seen:
            continue
        seen.add(game["id"])

        games.append({
            "id": game.get("id"),
            "name": game.get("name"),
            "background_image": game.get("background_image"),
            "rating": game.get("rating"),
            "released": game.get("released"),
            "genres": [g["name"] for g in game.get("genres", [])],
            "platforms": [p["platform"]["name"] for p in game.get("platforms", [])]
        })

    return jsonify({
        "status": "success",
        "games": games,
        "total": data.get("count", 0)
    })


@app.route("/api/games/<int:game_id>")
def get_game_details(game_id):
    game = fetch_from_rawg(f"games/{game_id}")

    if not game:
        return jsonify({"status": "error"}), 404

    return jsonify({
        "status": "success",
        "game": game
    })


@app.route("/api/news")
def get_news():
    return jsonify({
        "status": "success",
        "news": []
    })


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()

    if data.get("username") == "admin":
        token = create_access_token(identity="admin")
        return jsonify({"token": token})

    return jsonify({"error": "invalid"}), 401


@app.route("/api/protected")
@jwt_required()
def protected():
    user = get_jwt_identity()
    return jsonify({"user": user})


# =========================
# RUN
# =========================
# Gunicorn handles startup on Railway