import os
import sys
import requests
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

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
        print(f"Error: {e}")
        return None


# =========================
# HEALTH
# =========================
@app.route("/api/health")
def health():
    return jsonify({"status": "healthy"})


# =========================
# GAMES (UNCHANGED CORE)
# =========================
@app.route("/api/games")
def get_games():
    search = request.args.get("search", "")
    genres = request.args.get("genres", "")
    platforms = request.args.get("platforms", "")
    ordering = request.args.get("ordering", "-added")
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 20, type=int)

    params = {
        "ordering": ordering,
        "page": page,
        "page_size": page_size
    }

    if search:
        params["search"] = search
    if genres:
        params["genres"] = genres
    if platforms:
        params["platforms"] = platforms

    data = fetch_from_rawg("games", params)

    if not data:
        return jsonify({"status": "error"}), 500

    games = []
    for game in data.get("results", []):
        games.append({
            "id": game.get("id"),
            "name": game.get("name"),
            "background_image": game.get("background_image"),
            "rating": game.get("rating")
        })

    return jsonify({
        "status": "success",
        "games": games
    })


# =========================
# 🔥 FIXED: GENRES (IMPORTANT)
# =========================
@app.route("/api/games/genres")
def get_genres():
    data = fetch_from_rawg("genres", {"page_size": 50})

    if not data:
        return jsonify({"status": "error"}), 500

    genres = [
        {
            "name": genre["name"],   # display
            "slug": genre["slug"]    # API value (IMPORTANT FIX)
        }
        for genre in data.get("results", [])
    ]

    return jsonify({
        "status": "success",
        "genres": genres
    })


# =========================
# 🔥 FIXED: PLATFORMS (IMPORTANT)
# =========================
@app.route("/api/games/platforms")
def get_platforms():
    data = fetch_from_rawg("platforms", {"page_size": 50})

    if not data:
        return jsonify({"status": "error"}), 500

    platforms = [
        {
            "name": platform["name"],
            "slug": platform["slug"]   # IMPORTANT FIX
        }
        for platform in data.get("results", [])
    ]

    return jsonify({
        "status": "success",
        "platforms": platforms
    })


# AUTH (UNCHANGED)
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()

    if data.get("username") == "admin":
        token = create_access_token(identity="admin")
        return jsonify({"token": token})

    return jsonify({"error": "invalid"}), 401