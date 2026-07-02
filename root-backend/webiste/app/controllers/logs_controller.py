from flask import request
from sqlalchemy import select

from webiste.app.extensions import db
from webiste.app.helpers.responses import success_response
from webiste.app.models.user_log import UserLog


def list_logs():
    """Historial de acciones de usuarios, de la más reciente a la más antigua.

    Query params opcionales:
      - limit: cantidad máxima (default 50, tope 200)
      - user_id: filtra por usuario
      - action: filtra por acción (ej: auth_login, stream_audio)
    """
    try:
        limit = int(request.args.get("limit", 50))
    except ValueError:
        limit = 50
    limit = max(1, min(limit, 200))

    stmt = select(UserLog).order_by(UserLog.created_at.desc()).limit(limit)

    user_id = request.args.get("user_id")
    if user_id:
        stmt = stmt.where(UserLog.id_user == user_id)

    action = request.args.get("action")
    if action:
        stmt = stmt.where(UserLog.action == action)

    logs = db.session.execute(stmt).scalars().all()
    return success_response([log.to_dict() for log in logs])
