from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app, request

from webiste.app.extensions import db
from webiste.app.helpers.responses import error_response, success_response
from webiste.app.models.login import Login
from webiste.app.models.user import User


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def _supabase():
    """Obtiene el SupabaseService inicializado en bootstrap.py."""
    return current_app.supabase


def _supabase_error_message(exc) -> tuple[str, int]:
    """Mapea errores comunes de supabase-py a mensajes HTTP legibles.

    Retorna (mensaje, status_code).
    """
    message = str(exc).lower()
    raw = str(exc)

    if "invalid login credentials" in message or "invalid_grant" in message:
        return "Credenciales invalidas", 401
    if "user already registered" in message or "already been registered" in message:
        return "El email ya esta registrado", 409
    if "email not confirmed" in message:
        return "Debes confirmar tu email antes de iniciar sesion", 403
    if "password should be" in message or "password" in message and "short" in message:
        return "La contrasena no cumple los requisitos minimos", 422
    if "rate limit" in message or "too many" in message:
        return "Demasiados intentos, intenta mas tarde", 429
    if "api keys legacy jwt" in message or "empiezan con 'eyj'" in message:
        return (
            "Configura en el backend las API keys legacy de Supabase: SUPABASE_KEY=anon y SUPABASE_SERVICE_ROLE_KEY=service_role",
            500,
        )

    current_app.logger.warning("Supabase error no mapeado: %s", raw)
    return "Error de autenticacion con el proveedor", 502


def _issue_app_token(user: User) -> tuple[str, datetime]:
    """Genera y persiste un JWT propio de la app para el usuario dado."""
    secret = current_app.config["JWT_SECRET_KEY"]
    exp_hours = current_app.config.get("JWT_EXPIRATION_HOURS", 24)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=exp_hours)

    token = jwt.encode(
        {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role,
            "supabase_user_id": user.supabase_user_id,
            "exp": expires_at,
        },
        secret,
        algorithm="HS256",
    )

    db.session.add(Login(token=token, id_user=user.id, time=str(exp_hours * 3600)))
    db.session.commit()
    return token, expires_at


def _get_or_create_local_user(
    *,
    email: str,
    name: str,
    username: str,
    role: str,
    supabase_user_id: str,
) -> User:
    """Encuentra al usuario local por email/username/supabase_user_id, o lo crea."""
    user = None

    if supabase_user_id:
        user = User.query.filter_by(supabase_user_id=supabase_user_id).first()
    if user is None and email:
        user = User.query.filter_by(email=email).first()
    if user is None and username:
        user = User.query.filter_by(username=username).first()

    if user is None:
        user = User(
            name=name or username or email,
            username=username or (email.split("@")[0] if email else "user"),
            email=email,
            role=role or "user",
            supabase_user_id=supabase_user_id,
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Enlazar supabase_user_id si faltaba
        if supabase_user_id and not user.supabase_user_id:
            user.supabase_user_id = supabase_user_id
        if email and not user.email:
            user.email = email
        if name and (not user.name or user.name == user.username):
            user.name = name
        if role and (not user.role or user.role == "user"):
            user.role = role
        db.session.commit()

    return user


# ----------------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------------
def register():
    """Crea un usuario nuevo en Supabase Auth y lo espeja en la tabla local."""
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    name = (payload.get("name") or "").strip()
    username = (payload.get("username") or "").strip().lower()
    role = (payload.get("role") or "user").strip().lower()

    if not email or not password:
        return error_response("email y password son requeridos", 422)
    if len(password) < 6:
        return error_response("La contrasena debe tener al menos 6 caracteres", 422)

    # Verificar duplicados locales antes de pegar contra supabase
    if User.query.filter_by(email=email).first():
        return error_response("El email ya esta registrado", 409)
    if username and User.query.filter_by(username=username).first():
        return error_response("El username ya esta registrado", 409)

    metadata = {"name": name, "username": username, "role": role}

    try:
        supabase = _supabase()
        if supabase.has_admin_credentials:
            response = supabase.create_user(email=email, password=password, data=metadata)
        else:
            response = supabase.sign_up(email=email, password=password, data=metadata)
    except Exception as exc:  # noqa: BLE001
        message, status = _supabase_error_message(exc)
        return error_response(message, status)

    supabase_user = getattr(response, "user", None)
    if supabase_user is None:
        return error_response(
            "No se pudo crear el usuario (revisa la confirmacion de email en Supabase)",
            502,
        )

    supabase_user_id = getattr(supabase_user, "id", None)

    user = _get_or_create_local_user(
        email=email,
        name=name,
        username=username,
        role=role,
        supabase_user_id=supabase_user_id,
    )

    token, expires_at = _issue_app_token(user)

    return success_response(
        {
            "token": token,
            "expires_at": expires_at.isoformat(),
            "user": user.to_dict(),
        },
        "Registro exitoso",
        201,
    )


def login():
    """Autentica contra Supabase y emite un JWT propio de la app."""
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return error_response("email y password son requeridos", 422)

    try:
        response = _supabase().sign_in_with_password(email=email, password=password)
    except Exception as exc:  # noqa: BLE001
        message, status = _supabase_error_message(exc)
        return error_response(message, status)

    supabase_user = getattr(response, "user", None)
    if supabase_user is None:
        return error_response("Credenciales invalidas", 401)

    supabase_user_id = getattr(supabase_user, "id", None)
    user_meta = getattr(supabase_user, "user_metadata", None) or {}
    if isinstance(user_meta, dict):
        name = user_meta.get("name") or ""
        username = user_meta.get("username") or ""
        role = user_meta.get("role") or "user"
    else:
        name = username = ""
        role = "user"

    user = _get_or_create_local_user(
        email=email,
        name=name,
        username=username,
        role=role,
        supabase_user_id=supabase_user_id,
    )

    token, expires_at = _issue_app_token(user)

    return success_response(
        {
            "token": token,
            "expires_at": expires_at.isoformat(),
            "user": user.to_dict(),
        },
        "Login exitoso",
        200,
    )


def logout():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return error_response("Token requerido", 401)

    token = auth_header.removeprefix("Bearer ").strip()
    Login.query.filter_by(token=token).delete()
    db.session.commit()

    return success_response(message="Logout exitoso")


def forgot_password():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    if not email:
        return error_response("email es requerido", 422)

    try:
        _supabase().reset_password_for_email(email=email)
    except Exception as exc:  # noqa: BLE001
        current_app.logger.warning("forgot_password error: %s", exc)

    # Por seguridad siempre devolvemos el mismo mensaje (no revelar si el email existe)
    return success_response(
        message="Si el email existe, recibiras un correo para restablecer tu contrasena"
    )
