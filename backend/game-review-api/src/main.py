import os
import sys
import requests
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

app = Flask(__name__)

app.config["SECRET_KEY"] = "dev-secret-key"
app.config["JWT_SECRET_KEY"] = "jwt-secret-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

RAWG_API_KEY = os.getenv("RAWG_API_KEY")

if not RAWG_API_KEY:
    raise RuntimeError("RAWG_API_KEY is missing")

RAWG_BASE_URL = "https://api.rawg.io/api"

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
    import json
    return f"{endpoint}_{json.dumps(params, sort_keys=True)}"

def is_cache_valid(entry):
    return datetime.now() - entry["timestamp"] < timedelta(seconds=CACHE_DURATION)

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


@app.route("/api/health")
def health():
    return jsonify({"status": "healthy", "cache_size": len(cache)})


@app.route("/api/games")
def get_games():
    search = request.args.get("search", "")
    genres = request.args.get("genres", "")
    platforms = request.args.get("platforms", "")
    ordering = request.args.get("ordering", "-added")
    page = request.args.get("page", 1, type=int)
    page_size = min(request.args.get("page_size", 20, type=int), 40)

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
            "rating": game.get("rating", 0),
            "released": game.get("released"),
            "genres": [g["name"] for g in game.get("genres", [])],
            "platforms": [p["platform"]["name"] for p in game.get("platforms", [])],
            "metacritic": game.get("metacritic"),
            "playtime": game.get("playtime", 0)
        })

    return jsonify({
        "status": "success",
        "games": games,
        "total": data.get("count", 0),
        "next": data.get("next") is not None
    })


@app.route("/api/games/genres")
def get_genres():
    data = fetch_from_rawg("genres", {"page_size": 50})

    if not data:
        return jsonify({"status": "error"}), 500

    return jsonify({
        "status": "success",
        "genres": [g["name"] for g in data.get("results", [])]
    })


@app.route("/api/games/platforms")
def get_platforms():
    data = fetch_from_rawg("platforms", {"page_size": 50})

    if not data:
        return jsonify({"status": "error"}), 500

    return jsonify({
        "status": "success",
        "platforms": [p["name"] for p in data.get("results", [])]
    })