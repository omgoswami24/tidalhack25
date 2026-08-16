"""
Vercel serverless entry point for the Oculon API.

Vercel exposes any `app` (WSGI callable) defined in a file under `api/` as a
serverless function. `vercel.json` routes every /api/* request here, so the
Flask app serves the same routes it does locally - no separate code path.

The backend package lives in ../backend, which is not importable by default
from this directory, so it is placed on sys.path first.
"""

import os
import sys

BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, os.path.abspath(BACKEND_DIR))

from simple_app import app  # noqa: E402

# Vercel looks for a module-level `app`
__all__ = ['app']
